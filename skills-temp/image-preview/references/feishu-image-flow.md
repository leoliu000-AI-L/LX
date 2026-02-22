# Feishu Image Flow

Use this flow for reliable image delivery:

1. Generate local PNG (`scripts/generate_preview.py`).
2. If direct media path works in chat, send `MEDIA:./relative/path.png`.
3. If path delivery fails, upload image bytes to Feishu image endpoint, then send message with returned `image_key`.

## Base64 Safety Notes

- Do not post long raw base64 directly in group messages.
- Use base64 only as transport payload to upload APIs.
- Keep logs free of full base64 payloads.

## Recommended Default Limits

Use these defaults before opening bulk generation:

- per user: 2 images/minute, 20 images/hour, 100 images/day
- per group: 500 images/day
- bulk requests over 20 images: require confirmation
- budget cap reached: degrade to prompt-only mode

## Two-Step Isolation Requirement

Before any generation call:

1. Run task planning + user confirmation (`guarded_task_router.py plan/confirm`).
2. For image tasks (`edit/stylize/fusion`), run image understanding decomposition (`guarded_task_router.py analyze`) with role fields `subject/scene/style/safety` (+ width/height for non-local refs).
3. Run payload validation + isolated request build (`guarded_task_router.py build`).

Do not send raw conversation history to generation endpoints. Only forward the `sanitized_request` output from the router.

## Fast Workflow

1. Preview phase: 512 or 768 size, 1-3 variants.
2. Confirmation phase: user selects one variant.
3. Final phase: render 1024+ output.
