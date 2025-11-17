#!/usr/bin/env python3
"""
Utility to generate deterministic QR PNG files with no metadata.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import qrcode
from PIL import Image


def generate_qr(data: str, output: Path, *, version: int = 6, box_size: int = 10, border: int = 4) -> None:
    qr = qrcode.QRCode(
        version=version,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=False)
    img = qr.make_image(fill_color="black", back_color="white")
    img = img.convert("RGB")
    output.parent.mkdir(parents=True, exist_ok=True)
    img.save(output, format="PNG")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate deterministic QR PNG without metadata.")
    parser.add_argument("--data", required=True, help="Data string to encode")
    parser.add_argument("--output", required=True, help="Path to qr.png output")
    parser.add_argument("--version", type=int, default=6, help="QR version (default: 6)")
    parser.add_argument("--box-size", type=int, default=10, help="QR box size (default: 10)")
    parser.add_argument("--border", type=int, default=4, help="QR border size (default: 4)")
    args = parser.parse_args()

    generate_qr(
        data=args.data,
        output=Path(args.output),
        version=args.version,
        box_size=args.box_size,
        border=args.border,
    )


if __name__ == "__main__":
    main()
