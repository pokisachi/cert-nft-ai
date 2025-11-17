#!/usr/bin/env python3
"""
CLI entrypoint that renders the certificate XeLaTeX template using latexmk.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import subprocess
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict

from make_qr import generate_qr

REPO_ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_PATH = REPO_ROOT / "app" / "lib" / "pdf" / "template.tex"
FONTS_DIR = REPO_ROOT / "renderer" / "latex" / "fonts"
ASSETS_DIR = REPO_ROOT / "renderer" / "latex" / "assets"
DEFAULT_LOGO = ASSETS_DIR / "logo.png"

TEXT_KEYS = {
    "ISSUER_NAME",
    "STUDENT_NAME",
    "STUDENT_DOB",
    "COURSE_TITLE",
    "EXAM_SCORE",
    "EXAM_STATUS",
    "COMPLETION_DATE",
    "SIGNER_LEFT_NAME",
    "SIGNER_LEFT_ROLE",
    "SIGNER_RIGHT_NAME",
    "SIGNER_RIGHT_ROLE",
    "ISSUE_DATE",
    "CERTIFICATE_CODE",
    "PDF_TITLE",
    "PDF_AUTHOR",
    "PDF_SUBJECT",
    "PDF_KEYWORDS",
}

def tex_escape(value: str) -> str:
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(ch, ch) for ch in value)


def decode_logo(value: str, dest: Path) -> None:
    if value.startswith("data:image"):
        try:
            encoded = value.split(",", 1)[1]
        except IndexError as exc:
            raise ValueError("Invalid data URI for LOGO_SRC") from exc
        data = base64.b64decode(encoded)
        dest.write_bytes(data)
    else:
        src_path = Path(value)
        if not src_path.is_absolute():
            src_path = (REPO_ROOT / src_path).resolve()
        shutil.copyfile(src_path, dest)


def build_replacements(payload: Dict[str, Any], workdir: Path) -> Dict[str, str]:
    replacements: Dict[str, str] = {}
    for key in TEXT_KEYS:
        replacements[key] = tex_escape(str(payload.get(key, "") or ""))

    # SHOW_QR is raw lower-case true/false
    show_qr = str(payload.get("SHOW_QR", "false")).strip().lower() == "true"
    replacements["SHOW_QR"] = "true" if show_qr else "false"

    verify_url = str(payload.get("VERIFY_URL", "") or "")
    replacements["VERIFY_URL"] = tex_escape(verify_url)

    # Logo
    logo_source = payload.get("LOGO_SRC")
    logo_target = workdir / "logo.png"
    if isinstance(logo_source, str) and logo_source:
        decode_logo(logo_source, logo_target)
    else:
        shutil.copyfile(DEFAULT_LOGO, logo_target)
    replacements["LOGO_SRC"] = logo_target.name

    # QR
    qr_target = workdir / "qr.png"
    if show_qr and verify_url:
        generate_qr(verify_url, qr_target)
    else:
        # generate deterministic placeholder so LaTeX always finds the file
        generate_qr(replacements["CERTIFICATE_CODE"] or "preview", qr_target)
    replacements["QR_CODE"] = qr_target.name

    return replacements


def render_certificate(payload: Dict[str, Any], output_pdf: Path, *, template: Path = TEMPLATE_PATH) -> None:
    with tempfile.TemporaryDirectory(prefix="cert-latex-") as tmp_dir_str:
        tmp_dir = Path(tmp_dir_str)
        shutil.copytree(FONTS_DIR, tmp_dir / "fonts")

        replacements = build_replacements(payload, tmp_dir)
        tex_source = template.read_text(encoding="utf-8")
        for key, value in replacements.items():
            tex_source = tex_source.replace(f"{{{{{key}}}}}", value)

        tex_path = tmp_dir / "certificate.tex"
        tex_path.write_text(tex_source, encoding="utf-8")

        env = os.environ.copy()
        env["TZ"] = "UTC"

    sde = payload.get("SOURCE_DATE_EPOCH")
    if sde is None:
        issue_date = payload.get("ISSUE_DATE") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        dt_obj = datetime.fromisoformat(issue_date)
        if isinstance(dt_obj, datetime):
            dt = dt_obj
        elif isinstance(dt_obj, date):
            dt = datetime.combine(dt_obj, datetime.min.time())
        else:
            raise ValueError("Invalid ISSUE_DATE for SOURCE_DATE_EPOCH inference")
        sde = int(dt.replace(tzinfo=timezone.utc).timestamp())
    env["SOURCE_DATE_EPOCH"] = str(int(sde))

        cmd = [
            "latexmk",
            "-xelatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-quiet",
            tex_path.name,
        ]

        result = subprocess.run(
            cmd,
            cwd=tmp_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"latexmk failed: {result.stderr or result.stdout}")

        produced_pdf = tmp_dir / "certificate.pdf"
        shutil.copyfile(produced_pdf, output_pdf)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render certificate using XeLaTeX.")
    parser.add_argument("--input", required=True, help="Path to JSON payload file.")
    parser.add_argument("--output", required=True, help="Where to write the PDF.")
    parser.add_argument("--template", default=str(TEMPLATE_PATH), help="Path to LaTeX template.")
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    render_certificate(payload, Path(args.output), template=Path(args.template))
    print(json.dumps({"status": "ok", "output": args.output}))


if __name__ == "__main__":
    main()
