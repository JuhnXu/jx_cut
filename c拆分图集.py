import plistlib
import os
from PIL import Image

def split_sprite_sheet(plist_path):
    if not os.path.isfile(plist_path):
        print(f"❌ 找不到文件: {plist_path}")
        return

    base = os.path.splitext(plist_path)[0]
    img_path = base + ".png"
    if not os.path.isfile(img_path):
        print(f"❌ 找不到图集图片: {img_path}")
        return

    with open(plist_path, "rb") as f:
        plist_data = plistlib.load(f)

    sheet = Image.open(img_path).convert("RGBA")

    out_dir = os.path.join(os.path.dirname(plist_path), "split_done")
    os.makedirs(out_dir, exist_ok=True)

    frames = plist_data.get("frames", {})
    print(f"\n📦 找到 {len(frames)} 个精灵，开始拆分...\n")

    def parse_rect(s):
        s = s.replace("{", "").replace("}", "").replace(" ", "")
        return list(map(int, s.split(",")))

    for name, info in frames.items():
        try:
            x, y, w, h = parse_rect(info["textureRect"])
            rotated = info["textureRotated"]

            if not rotated:
                img = sheet.crop((x, y, x + w, y + h))
            else:
                img = sheet.crop((x, y, x + h, y + w))
                img = img.rotate(90, expand=True)

            save_path = os.path.join(out_dir, name)
            img.save(save_path, "PNG")
            print(f"✅ {name}")

        except Exception as e:
            print(f"❌ {name} 错误: {e}")

    print(f"\n🎉 拆分完成！文件保存在 → {out_dir}")

if __name__ == "__main__":
    print("=" * 50)
    print("        Cocos 图集拆分工具（适配你的plist格式）")
    print("=" * 50)
    user_input = input("\n请输入图集名称（不需要输后缀 .plist）：").strip()
    
    if user_input:
        plist_name = user_input + ".plist"
        split_sprite_sheet(plist_name)
    else:
        print("❌ 请输入正确名称！")
