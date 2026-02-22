#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import secrets
import subprocess
import time
from typing import Any, Dict, List, Optional, Tuple

TASKS = ("text2img", "edit", "stylize", "fusion")
CONFIRM_WORDS = {
    "yes",
    "y",
    "ok",
    "okay",
    "go",
    "confirm",
    "confirmed",
    "sure",
    "continue",
    "可以",
    "确认",
    "继续",
    "行",
    "好",
    "没问题",
}

TASK_HINTS = {
    "text2img": ["文生图", "生图", "text2img", "text-to-image", "prompt", "生成图片"],
    "edit": ["改图", "编辑", "局部", "修图", "inpaint", "outpaint", "erase", "remove"],
    "stylize": ["风格化", "风格迁移", "stylize", "style"],
    "fusion": ["融合", "合成", "拼图", "多图", "compose", "blend"],
}

TASK_RULES = {
    "text2img": {
        "required": ["prompt"],
        "forbidden": ["base_image", "style_image", "mask_image", "fusion_images"],
    },
    "edit": {
        "required": ["prompt", "base_image"],
        "forbidden": ["fusion_images"],
    },
    "stylize": {
        "required": ["prompt", "base_image"],
        "forbidden": ["fusion_images", "mask_image"],
        "one_of": ["style_image", "style_prompt"],
    },
    "fusion": {
        "required": ["prompt", "fusion_images"],
        "forbidden": ["mask_image"],
    },
}

ALLOWED_COMMON_FIELDS = {
    "prompt",
    "negative_prompt",
    "size",
    "seed",
    "guidance",
    "steps",
    "base_image",
    "mask_image",
    "style_image",
    "style_prompt",
    "fusion_images",
}

SIZE_ALLOWLIST = {"512x512", "768x768", "1024x1024", "1024x1365", "1365x1024"}
IMAGE_SEMANTIC_FIELDS = ("subject", "scene", "style", "safety")


def now_ts() -> int:
    return int(time.time())


def workspace_dir() -> str:
    return os.environ.get("OPENCLAW_WORKSPACE", os.path.expanduser("~/.openclaw/workspace"))


def default_state_dir() -> str:
    return os.path.join(workspace_dir(), ".openclaw", "state", "image-preview")


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def safe_session_id(session_id: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_.-]", "_", session_id.strip())
    return value[:128] or "default"


def state_path(state_dir: str, session_id: str) -> str:
    ensure_dir(state_dir)
    return os.path.join(state_dir, f"{safe_session_id(session_id)}.json")


def load_state(state_dir: str, session_id: str) -> Dict[str, Any]:
    path = state_path(state_dir, session_id)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state_dir: str, session_id: str, payload: Dict[str, Any]) -> None:
    path = state_path(state_dir, session_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def reset_state(state_dir: str, session_id: str) -> None:
    path = state_path(state_dir, session_id)
    if os.path.exists(path):
        os.remove(path)


def infer_task(message: str) -> Optional[str]:
    msg = message.lower()
    best = None
    best_score = 0
    for task, hints in TASK_HINTS.items():
        score = sum(1 for h in hints if h.lower() in msg)
        if score > best_score:
            best = task
            best_score = score
    return best


def make_nonce() -> str:
    return f"CFM-{secrets.token_hex(3).upper()}"


def is_confirmed(message: str, nonce: str) -> bool:
    raw = message.strip()
    if nonce and nonce in raw.upper():
        return True
    low = raw.lower()
    return low in CONFIRM_WORDS


def summary_for_task(task: str) -> str:
    if task == "text2img":
        return "文生图（禁止图片输入）"
    if task == "edit":
        return "图片编辑（需要 base_image，可选 mask_image）"
    if task == "stylize":
        return "图片风格化（需要 base_image，style_image 或 style_prompt 至少一个）"
    return "图片融合（需要 fusion_images >= 2）"


def required_fields_for_task(task: str) -> Dict[str, Any]:
    rule = TASK_RULES[task]
    required = list(rule.get("required", []))
    one_of = list(rule.get("one_of", []))
    forbidden = list(rule.get("forbidden", []))
    return {
        "required": required,
        "one_of": one_of,
        "forbidden": forbidden,
        "size_allowlist": sorted(SIZE_ALLOWLIST),
        "needs_image_understanding": task != "text2img",
    }


def validate_task_payload(task: str, payload: Dict[str, Any]) -> List[str]:
    errs: List[str] = []
    rule = TASK_RULES[task]

    for key in rule.get("required", []):
        if key not in payload or payload[key] in (None, "", []):
            errs.append(f"missing required field: {key}")

    for key in rule.get("forbidden", []):
        if key in payload and payload[key] not in (None, "", []):
            errs.append(f"forbidden field for {task}: {key}")

    one_of = rule.get("one_of")
    if one_of and not any(payload.get(k) not in (None, "", []) for k in one_of):
        errs.append(f"at least one of {', '.join(one_of)} is required")

    if task == "fusion":
        imgs = payload.get("fusion_images", [])
        if not isinstance(imgs, list) or len(imgs) < 2:
            errs.append("fusion_images must be an array with at least 2 images")

    if "size" in payload and payload["size"] not in SIZE_ALLOWLIST:
        errs.append(f"size not allowed: {payload['size']}")

    return errs


def load_payload(payload_json: Optional[str], payload_file: Optional[str]) -> Dict[str, Any]:
    if payload_json:
        return json.loads(payload_json)
    if payload_file:
        with open(payload_file, "r", encoding="utf-8") as f:
            return json.load(f)
    raise ValueError("payload is required")


def extract_image_roles(task: str, payload: Dict[str, Any]) -> Dict[str, str]:
    refs: Dict[str, str] = {}
    if task == "edit":
        base = payload.get("base_image")
        mask = payload.get("mask_image")
        if base:
            refs["base"] = str(base)
        if mask:
            refs["mask"] = str(mask)
    elif task == "stylize":
        base = payload.get("base_image")
        style = payload.get("style_image")
        if base:
            refs["base"] = str(base)
        if style:
            refs["style"] = str(style)
    elif task == "fusion":
        imgs = payload.get("fusion_images", [])
        if isinstance(imgs, list):
            for idx, ref in enumerate(imgs, 1):
                if ref:
                    refs[f"fusion_{idx}"] = str(ref)
    return refs


def refs_digest(refs: Dict[str, str]) -> str:
    body = json.dumps(refs, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def probe_local_image(path: str) -> Optional[Dict[str, Any]]:
    if not isinstance(path, str) or not os.path.exists(path):
        return None
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,pix_fmt",
        "-of",
        "json",
        path,
    ]
    try:
        out = subprocess.check_output(cmd, text=True)
        obj = json.loads(out)
        streams = obj.get("streams") or []
        if not streams:
            return None
        s = streams[0]
        width = int(s.get("width", 0))
        height = int(s.get("height", 0))
        return {
            "width": width,
            "height": height,
            "aspect": f"{width}:{height}" if width and height else "unknown",
            "pix_fmt": s.get("pix_fmt") or "unknown",
            "source": "local_probe",
        }
    except Exception:
        return None


def validate_and_build_image_understanding(task: str, payload: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[str], str]:
    refs = extract_image_roles(task, payload)
    errs: List[str] = []
    items: List[Dict[str, Any]] = []

    if not refs:
        errs.append("no image refs found for image task")
        return items, errs, refs_digest(refs)

    understanding = payload.get("image_understanding")
    if understanding is None or not isinstance(understanding, dict):
        errs.append("image_understanding object is required for image tasks")
        return items, errs, refs_digest(refs)

    for role, ref in refs.items():
        role_meta = understanding.get(role)
        if not isinstance(role_meta, dict):
            errs.append(f"image_understanding.{role} is required")
            continue

        item: Dict[str, Any] = {"role": role, "ref": ref}

        local = probe_local_image(ref)
        if local:
            item.update(local)
        else:
            width = role_meta.get("width")
            height = role_meta.get("height")
            if not isinstance(width, int) or not isinstance(height, int) or width <= 0 or height <= 0:
                errs.append(f"{role}: width/height required for non-local refs")
            else:
                item["width"] = width
                item["height"] = height
                item["aspect"] = role_meta.get("aspect") or f"{width}:{height}"
                item["source"] = "manual"

        for field in IMAGE_SEMANTIC_FIELDS:
            value = role_meta.get(field)
            if not isinstance(value, str) or not value.strip():
                errs.append(f"{role}: missing semantic field `{field}`")
            else:
                item[field] = value.strip()

        items.append(item)

    return items, errs, refs_digest(refs)


def isolate_payload(task: str, payload: Dict[str, Any], session_id: str, nonce: str, image_understanding: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    clean: Dict[str, Any] = {}
    for key in ALLOWED_COMMON_FIELDS:
        if key in payload and payload[key] not in (None, ""):
            clean[key] = payload[key]

    if task == "text2img":
        for key in ("base_image", "mask_image", "style_image", "style_prompt", "fusion_images"):
            clean.pop(key, None)
    elif task == "edit":
        clean.pop("style_image", None)
        clean.pop("style_prompt", None)
        clean.pop("fusion_images", None)
    elif task == "stylize":
        clean.pop("mask_image", None)
        clean.pop("fusion_images", None)
    elif task == "fusion":
        clean.pop("base_image", None)
        clean.pop("mask_image", None)
        clean.pop("style_image", None)
        clean.pop("style_prompt", None)

    clean.setdefault("size", "1024x1024")
    clean.setdefault("seed", 314159)
    clean.setdefault("guidance", 6.5)
    clean.setdefault("steps", 28)

    if image_understanding:
        clean["image_understanding"] = image_understanding

    iso_material = json.dumps(clean, ensure_ascii=False, sort_keys=True)
    iso_hash = hashlib.sha256(f"{session_id}|{task}|{nonce}|{iso_material}".encode("utf-8")).hexdigest()

    return {
        "task": task,
        "sanitized_request": clean,
        "isolation": {
            "session": session_id,
            "nonce": nonce,
            "hash": iso_hash,
            "mode": "task-confirmed-whitelist-only",
        },
    }


def cmd_plan(args: argparse.Namespace) -> int:
    task = infer_task(args.message)
    if task is None:
        print(json.dumps(
            {
                "ok": False,
                "stage": "need_task_clarification",
                "message": "无法从当前会话判断任务类型，请明确是 text2img/edit/stylize/fusion。",
            },
            ensure_ascii=False,
            indent=2,
        ))
        return 1

    nonce = make_nonce()
    payload = {
        "stage": "await_task_confirmation",
        "task": task,
        "nonce": nonce,
        "source_message": args.message,
        "created_at": now_ts(),
        "expires_at": now_ts() + args.ttl,
        "required_fields": required_fields_for_task(task),
    }
    save_state(args.state_dir, args.session, payload)

    print(json.dumps(
        {
            "ok": True,
            "stage": payload["stage"],
            "task": task,
            "task_summary": summary_for_task(task),
            "nonce": nonce,
            "confirm_message": f"请确认任务类型: {task}（{summary_for_task(task)}）。回复 `{nonce}` 或 `确认` 继续。",
        },
        ensure_ascii=False,
        indent=2,
    ))
    return 0


def cmd_confirm(args: argparse.Namespace) -> int:
    state = load_state(args.state_dir, args.session)
    if not state:
        print(json.dumps({"ok": False, "message": "没有待确认任务，请先运行 plan。"}, ensure_ascii=False, indent=2))
        return 1
    if state.get("stage") != "await_task_confirmation":
        print(json.dumps({"ok": False, "message": "当前状态不是待确认。", "state": state.get("stage")}, ensure_ascii=False, indent=2))
        return 1
    if state.get("expires_at", 0) < now_ts():
        reset_state(args.state_dir, args.session)
        print(json.dumps({"ok": False, "message": "确认已过期，请重新 plan。"}, ensure_ascii=False, indent=2))
        return 1

    nonce = state.get("nonce", "")
    if not is_confirmed(args.message, nonce):
        print(
            json.dumps(
                {
                    "ok": False,
                    "message": "未检测到确认指令。请回复确认词或 nonce。",
                    "nonce": nonce,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1

    task = state["task"]
    state["confirmed_at"] = now_ts()

    if task == "text2img":
        state["stage"] = "await_task_inputs"
        next_msg = "请提交任务参数 JSON。仅白名单字段会进入生成请求。"
    else:
        state["stage"] = "await_image_understanding"
        next_msg = "请先提交图片字段拆解（image_understanding），完成图片理解后再 build。"

    save_state(args.state_dir, args.session, state)

    print(
        json.dumps(
            {
                "ok": True,
                "stage": state["stage"],
                "task": task,
                "required_fields": state["required_fields"],
                "message": next_msg,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


def cmd_analyze(args: argparse.Namespace) -> int:
    state = load_state(args.state_dir, args.session)
    if not state:
        print(json.dumps({"ok": False, "message": "没有活跃任务，请先 plan + confirm。"}, ensure_ascii=False, indent=2))
        return 1

    task = state.get("task")
    stage = state.get("stage")
    if task == "text2img":
        print(json.dumps({"ok": False, "message": "text2img 不需要图片理解步骤。"}, ensure_ascii=False, indent=2))
        return 1

    if stage not in ("await_image_understanding", "await_task_inputs"):
        print(json.dumps({"ok": False, "message": "当前阶段不允许 analyze", "stage": stage}, ensure_ascii=False, indent=2))
        return 1

    payload = load_payload(args.payload_json, args.payload_file)
    analysis, errs, digest = validate_and_build_image_understanding(task, payload)

    if errs:
        print(
            json.dumps(
                {
                    "ok": False,
                    "stage": "image_understanding_invalid",
                    "task": task,
                    "errors": errs,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1

    state["image_understanding"] = {
        "refs_hash": digest,
        "roles": analysis,
        "analyzed_at": now_ts(),
    }
    state["stage"] = "await_task_inputs"
    save_state(args.state_dir, args.session, state)

    print(
        json.dumps(
            {
                "ok": True,
                "stage": "await_task_inputs",
                "task": task,
                "image_understanding": state["image_understanding"],
                "message": "图片理解完成。现在可以执行 build。",
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    state = load_state(args.state_dir, args.session)
    if not state or state.get("stage") != "await_task_inputs":
        print(json.dumps({"ok": False, "message": "没有待构建任务，请先 plan + confirm（图片任务还需 analyze）。"}, ensure_ascii=False, indent=2))
        return 1

    task = state["task"]
    payload = load_payload(args.payload_json, args.payload_file)

    errs = validate_task_payload(task, payload)
    if errs:
        print(
            json.dumps(
                {
                    "ok": False,
                    "stage": "input_invalid",
                    "task": task,
                    "errors": errs,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1

    image_understanding = None
    if task != "text2img":
        understanding = state.get("image_understanding")
        if not isinstance(understanding, dict):
            print(json.dumps({"ok": False, "message": "缺少图片理解结果，请先执行 analyze。"}, ensure_ascii=False, indent=2))
            return 1

        digest_now = refs_digest(extract_image_roles(task, payload))
        if digest_now != understanding.get("refs_hash"):
            print(
                json.dumps(
                    {
                        "ok": False,
                        "message": "图片输入与已分析内容不一致，请重新 analyze 后再 build。",
                        "expected_refs_hash": understanding.get("refs_hash"),
                        "current_refs_hash": digest_now,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 1

        image_understanding = understanding.get("roles")

    isolated = isolate_payload(task, payload, args.session, state.get("nonce", ""), image_understanding)
    state["stage"] = "ready"
    state["ready_at"] = now_ts()
    state["isolated_hash"] = isolated["isolation"]["hash"]
    save_state(args.state_dir, args.session, state)

    print(
        json.dumps(
            {
                "ok": True,
                "stage": "ready",
                "task": task,
                "isolated_request": isolated,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    state = load_state(args.state_dir, args.session)
    print(json.dumps({"ok": True, "state": state}, ensure_ascii=False, indent=2))
    return 0


def cmd_reset(args: argparse.Namespace) -> int:
    reset_state(args.state_dir, args.session)
    print(json.dumps({"ok": True, "message": "state reset"}, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Two-step guarded task router for image generation workflows.")
    parser.add_argument("--state-dir", default=default_state_dir())

    sub = parser.add_subparsers(dest="cmd", required=True)

    p_plan = sub.add_parser("plan")
    p_plan.add_argument("--session", required=True)
    p_plan.add_argument("--message", required=True)
    p_plan.add_argument("--ttl", type=int, default=1800)
    p_plan.set_defaults(func=cmd_plan)

    p_confirm = sub.add_parser("confirm")
    p_confirm.add_argument("--session", required=True)
    p_confirm.add_argument("--message", required=True)
    p_confirm.set_defaults(func=cmd_confirm)

    p_analyze = sub.add_parser("analyze")
    p_analyze.add_argument("--session", required=True)
    analyze_group = p_analyze.add_mutually_exclusive_group(required=True)
    analyze_group.add_argument("--payload-json")
    analyze_group.add_argument("--payload-file")
    p_analyze.set_defaults(func=cmd_analyze)

    p_build = sub.add_parser("build")
    p_build.add_argument("--session", required=True)
    build_group = p_build.add_mutually_exclusive_group(required=True)
    build_group.add_argument("--payload-json")
    build_group.add_argument("--payload-file")
    p_build.set_defaults(func=cmd_build)

    p_status = sub.add_parser("status")
    p_status.add_argument("--session", required=True)
    p_status.set_defaults(func=cmd_status)

    p_reset = sub.add_parser("reset")
    p_reset.add_argument("--session", required=True)
    p_reset.set_defaults(func=cmd_reset)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
