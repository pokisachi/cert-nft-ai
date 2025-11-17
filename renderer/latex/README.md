# XeLaTeX Renderer

This directory contains the deterministic XeLaTeX toolchain that replaces the
old HTML + Puppeteer PDF flow.

## Structure

- `render.py` – CLI entry that patches `app/lib/pdf/template.tex`, copies fonts,
  generates QR and runs `latexmk -xelatex -interaction=nonstopmode -halt-on-error -quiet`.
- `make_qr.py` – deterministic QR generator (version 6, EC Q, box size 10, border 4).
- `fonts/` – bundled Merriweather + Playfair Display TTF files (no network fetch).
- `assets/` – static assets used by the renderer (currently the default logo).
- `samples/` – sample JSON payloads used to validate deterministic output.
- `requirements.txt` – python dependencies (`qrcode[pil]`, `Pillow`).

## Usage

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r renderer/latex/requirements.txt

python renderer/latex/render.py \
  --input renderer/latex/samples/sample_request.json \
  --output out.pdf
```

Environment variables set in the script:

- `TZ=UTC`
- `SOURCE_DATE_EPOCH` – taken from payload or derived from `ISSUE_DATE`.

The script expects `latexmk` + XeLaTeX binaries to be available (TeX Live 2024
recommended). For production, run inside a Docker image that pins TeX Live and
wraps this script; Dockerfile will be added once the system-wide container
strategy is finalized.

## Deterministic validation

1. Render twice with the same payload; the generated PDFs must have identical
   SHA-256 hashes.
2. Switch `SHOW_QR` between `true`/`false` to validate preview/final behavior.
3. Compare the new XeLaTeX PDF with the legacy HTML output using `diff-pdf` or
   another visual diff tool (tolerance ≤ 2px).

## Integration notes

- The Next.js route writes payload JSON into a temp dir, calls `render.py`, then
  reads the resulting PDF and computes `docHash`.
- All metadata/placeholder fields (`STUDENT_NAME`, `CERTIFICATE_CODE`, etc.)
  map one-to-one with the template macros.
- Font or asset changes must remain local to keep the renderer offline-friendly.
