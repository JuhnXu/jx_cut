import plistlib
import os
from PIL import Image

def split_sprite_sheet(plist_path):
    # 检查文件
    if not os.path.isfile(plist_path):
        print(f"不存在: {plist_path}")
        return

    # 自动找同目录同名图片
    base = os.path.splitext(plist_path)[0]
    img_path = base + ".png"
    if not os.path.isfile(img_path):
        print(f"找不到图集: {img_path}")
        return

    # 读取 plist
    with open(plist_path, "rb") as f:
        plist_data = plistlib.load(f)

    # 打开大图
    sheet = Image.open(img_path).convert("RGBA")
    sheet_w, sheet_h = sheet.size

    # 输出目录
    out_dir = os.path.join(os.path.dirname(plist_path), "split_ok")
    os.makedirs(out_dir, exist_ok=True)

    frames = plist_data.get("frames", {})
    print(f"总数量: {len(frames)}")

    # 解析 { {x,y},{w,h} } → [x,y,w,h]
    def parse_tex_rect(s):
        s = s.replace("{", "").replace("}", "").replace(" ", "")
        return list(map(int, s.split(",")))

    # 逐张拆分
    for name, info in frames.items():
        try:
            x, y, w, h = parse_tex_rect(info["textureRect"])
            rotated = info["textureRotated"]

            if not rotated:
                # 正常图：直接裁剪
                img = sheet.crop((x, y, x + w, y + h))
            else:
                # 旋转图：先裁 (w/h 互换) → 逆时针旋转90度
                img = sheet.crop((x, y, x + h, y + w))
                img = img.rotate(90, expand=True)

            # 保存
            save_path = os.path.join(out_dir, name)
            img.save(save_path, "PNG")
            print(f"✅ {name}")

        except Exception as e:
            print(f"❌ {name} 错误: {e}")

    print(f"\n✅ 全部完成！文件在: {out_dir}")

if __name__ == "__main__":
    split_sprite_sheet("skipGame.plist")
