---
name: image-preview
description: Generate quick local PNG previews and optional batches for Feishu/IM conversations when users ask for "make an image now", "preview first", or "batch generate" before full image API wiring. Enforce two-step task isolation (plan+confirm, then validated build) for text2img/edit/stylize/fusion to prevent context pollution in image requests.
---

# Image Preview

Generate fast preview images locally, then send to chat with minimal latency.

## Quick Start

Generate one preview:

```bash
python3 scripts/generate_preview.py \
  --output ./output/hero-preview.png \
  --width 768 --height 768 \
  --style poster --seed 42
```

Generate 3 variants in one call:

```bash
python3 scripts/generate_preview.py \
  --output ./output/hero-preview.png \
  --width 768 --height 768 \
  --style comic --seed 100 --count 3
```

Encode one PNG for upload payloads:

```bash
python3 scripts/encode_image_base64.py --path ./output/hero-preview_001.png --data-url
```

## Two-Step Task Isolation (Code-Level)

Always run image generation through a two-step guard before calling any model endpoint.

1) Plan + confirm task type from the session.
2) For image tasks, run image understanding analyze (field decomposition + metadata check).
3) Build isolated request from validated task payload only.

```bash
# Step 1: infer task from latest conversation text
python3 scripts/guarded_task_router.py plan \
  --session "feishu:group:oc_xxx" \
  --message "文生图 真实人像"

# Step 1b: wait for user confirmation (nonce or explicit confirmation)
python3 scripts/guarded_task_router.py confirm \
  --session "feishu:group:oc_xxx" \
  --message "确认"

# Step 2a (image tasks only): run image understanding decomposition
python3 scripts/guarded_task_router.py analyze \
  --session "feishu:group:oc_xxx" \
  --payload-file ./payload.json

# Step 2b: submit task-specific payload and get isolated request
python3 scripts/guarded_task_router.py build \
  --session "feishu:group:oc_xxx" \
  --payload-file ./payload.json
```

Routing hard rules:

- `text2img`: no image inputs allowed.
- `edit`: `base_image` required (optional `mask_image`).
- `stylize`: `base_image` required, and `style_image` or `style_prompt` required.
- `fusion`: `fusion_images` must contain at least 2 images.
- Image tasks must provide `image_understanding` by role (`base/style/mask/fusion_n`) with semantic fields: `subject`, `scene`, `style`, `safety`; non-local refs also need `width` and `height`.

Only whitelisted fields enter `sanitized_request`; raw chat history is blocked from the final generation payload.

## Workflow

1. Generate 1-3 low-res previews first (512 or 768).
2. Share preview image to group (`MEDIA:./relative/path.png`).
3. After direction confirmation, render final image (1024+).
4. For large requests, enforce limits before generating.

## Defaults

- Preview: 768x768, count=1..3
- Final: 1024x1024 or higher
- Style: `poster` for cinematic, `comic` for brighter contrast, `minimal` for cleaner look

## Safety and Cost Control

Apply these defaults unless product owner overrides:

- per user: 2 images/minute, 20 images/hour, 100 images/day
- per group: 500 images/day
- bulk >20 images: require explicit confirmation
- budget threshold reached: switch to prompt-only mode

## References

- Read `references/feishu-image-flow.md` for Feishu delivery details and fallback flow.
- Read `references/task-input-schemas.json` for task-specific payload templates.
- Use `scripts/guarded_task_router.py` for two-step routing and isolation enforcement.
