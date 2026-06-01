"""Enable Cursor Agent Legacy Terminal Tool in global state.vscdb."""
import json
import re
import sqlite3
import sys
from pathlib import Path

DB = Path(r"C:\Users\Administrator\AppData\Roaming\Cursor\User\globalStorage\state.vscdb")
KEY_HINTS = ("applicationUserPersistentStorage", "composerState", "useLegacyTerminalTool")


def main() -> int:
    if not DB.exists():
        print(f"Database not found: {DB}")
        return 1

    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT key, value FROM ItemTable")
    updated = 0
    for key, value in cur.fetchall():
        if value is None:
            continue
        text = value if isinstance(value, str) else value.decode("utf-8", errors="replace")
        if "useLegacyTerminalTool" not in text and "composerState" not in text:
            continue
        if '"useLegacyTerminalTool":false' in text or '"useLegacyTerminalTool": false' in text:
            new_text = re.sub(
                r'"useLegacyTerminalTool"\s*:\s*false',
                '"useLegacyTerminalTool":true',
                text,
            )
            if new_text != text:
                cur.execute("UPDATE ItemTable SET value=? WHERE key=?", (new_text, key))
                print(f"Updated key: {key}")
                updated += 1
        elif '"useLegacyTerminalTool":true' in text or '"useLegacyTerminalTool": true' in text:
            print(f"Already enabled in key: {key}")
            updated += 1
        else:
            # Try JSON patch for nested composerState
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue
            changed = patch_json(data)
            if changed:
                cur.execute(
                    "UPDATE ItemTable SET value=? WHERE key=?",
                    (json.dumps(data, separators=(",", ":")), key),
                )
                print(f"Patched JSON key: {key}")
                updated += 1

    con.commit()
    con.close()
    if updated:
        print("Legacy Terminal Tool enabled. Restart Cursor completely.")
        return 0
    print("No matching storage entry found; enable manually in Settings > Agents.")
    return 2


def patch_json(obj) -> bool:
    changed = False
    if isinstance(obj, dict):
        if "composerState" in obj and isinstance(obj["composerState"], dict):
            if obj["composerState"].get("useLegacyTerminalTool") is not True:
                obj["composerState"]["useLegacyTerminalTool"] = True
                changed = True
        if obj.get("useLegacyTerminalTool") is not True and "composerState" not in obj:
            if "useLegacyTerminalTool" in obj:
                obj["useLegacyTerminalTool"] = True
                changed = True
        for v in obj.values():
            if patch_json(v):
                changed = True
    elif isinstance(obj, list):
        for item in obj:
            if patch_json(item):
                changed = True
    return changed


if __name__ == "__main__":
    sys.exit(main())
