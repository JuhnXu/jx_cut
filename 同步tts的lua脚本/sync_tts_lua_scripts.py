import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path.cwd()
SCRIPT_DIR = ROOT / "tts_scripts"
MANIFEST_PATH = SCRIPT_DIR / "manifest.json"


@dataclass
class ScriptEntry:
    path: str
    name: str
    nickname: str
    file: str
    lines: int


def find_json_path() -> Path:
    workshop_dir = ROOT / "Workshop"
    if not workshop_dir.exists():
        raise FileNotFoundError(f"Workshop directory not found: {workshop_dir}")
    json_files = sorted(workshop_dir.glob("*.json"))
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in: {workshop_dir}")
    return json_files[0]


def load_json(json_path: Path) -> dict:
    return json.loads(json_path.read_text(encoding="utf-8"))


def save_json(json_path: Path, data: dict) -> None:
    backup_path = json_path.with_suffix(".json.bak")
    backup_path.write_text(json_path.read_text(encoding="utf-8"), encoding="utf-8")
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def iter_scripts(obj, path="root"):
    if isinstance(obj, dict):
        if "LuaScript" in obj:
            script = obj.get("LuaScript") or ""
            if script.strip():
                yield {
                    "path": path,
                    "name": obj.get("Name") or "",
                    "nickname": obj.get("Nickname") or "",
                    "script": script,
                }
        for key, value in obj.items():
            yield from iter_scripts(value, f"{path}/{key}")
    elif isinstance(obj, list):
        for idx, value in enumerate(obj):
            yield from iter_scripts(value, f"{path}[{idx}]")


def slugify(text: str) -> str:
    text = re.sub(r"[^A-Za-z0-9._-]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_.")
    return text or "script"


def build_filename(entry: dict) -> str:
    base = slugify(entry["path"])
    label = entry["nickname"] or entry["name"] or "script"
    return f"{base}__{slugify(label)}.lua"


def extract():
    json_path = find_json_path()
    data = load_json(json_path)
    SCRIPT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []
    for entry in iter_scripts(data):
        file_name = build_filename(entry)
        (SCRIPT_DIR / file_name).write_text(entry["script"], encoding="utf-8")
        manifest.append(
            ScriptEntry(
                path=entry["path"],
                name=entry["name"],
                nickname=entry["nickname"],
                file=file_name,
                lines=entry["script"].count("\n") + 1,
            ).__dict__
        )

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"source: {json_path}")
    print(f"extracted {len(manifest)} scripts to {SCRIPT_DIR}")


def apply():
    json_path = find_json_path()
    data = load_json(json_path)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    path_map = {item["path"]: item for item in manifest}
    updated = 0

    def walk(obj, path="root"):
        nonlocal updated
        if isinstance(obj, dict):
            if "LuaScript" in obj and path in path_map:
                item = path_map[path]
                script_path = SCRIPT_DIR / item["file"]
                obj["LuaScript"] = script_path.read_text(encoding="utf-8")
                updated += 1
            for key, value in obj.items():
                walk(value, f"{path}/{key}")
        elif isinstance(obj, list):
            for idx, value in enumerate(obj):
                walk(value, f"{path}[{idx}]")

    walk(data)
    save_json(json_path, data)
    print(f"source: {json_path}")
    print(f"updated {updated} scripts in {json_path}")


def main():
    parser = argparse.ArgumentParser(description="Extract and sync TTS LuaScript blocks.")
    sub = parser.add_subparsers(dest="cmd")
    sub.add_parser("extract")
    sub.add_parser("apply")
    args = parser.parse_args()

    if args.cmd == "apply":
        apply()
    else:
        extract()


if __name__ == "__main__":
    main()
