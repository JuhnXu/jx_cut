import json
from pathlib import Path


ROOT = Path.cwd()
WORKSHOP_DIR = ROOT / "Workshop"
SCRIPT_DIR = ROOT / "tts_scripts"
MANIFEST_PATH = SCRIPT_DIR / "manifest.json"


def find_json_path() -> Path:
    json_files = sorted(WORKSHOP_DIR.glob("*.json"))
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in: {WORKSHOP_DIR}")
    return json_files[0]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    backup_path = path.with_suffix(".json.bak")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    json_path = find_json_path()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    path_map = {item["path"]: item for item in manifest}
    data = load_json(json_path)
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
    print(f"updated {updated} scripts")


if __name__ == "__main__":
    main()
