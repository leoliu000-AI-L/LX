#!/usr/bin/env python3
import argparse
import base64
import mimetypes
import os


def main():
    parser = argparse.ArgumentParser(description="Encode image as base64 for API upload payloads.")
    parser.add_argument("--path", required=True, help="Path to local image file.")
    parser.add_argument("--data-url", action="store_true", help="Print as data URL instead of raw base64.")
    args = parser.parse_args()

    with open(args.path, "rb") as f:
        raw = f.read()

    b64 = base64.b64encode(raw).decode("ascii")
    if args.data_url:
        mime = mimetypes.guess_type(args.path)[0] or "application/octet-stream"
        print(f"data:{mime};base64,{b64}")
    else:
        print(b64)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
