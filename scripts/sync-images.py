# 把根目录 images/ 里的原始照片同步为 public/images/ 下的站点图片。
#
# 背景：根目录 images/ 是旧 Jekyll 时代遗留的照片目录，被 .gitignore 排除，
# Next.js 静态导出只复制 public/，因此文章里写的 /images/xxx.jpg 在线上必然 404。
# 另外原图多为 .JPG（大写）而文章写 .jpg（小写），GitHub Pages 的 Linux 文件系统
# 区分大小写，同样会 404。本脚本按文章实际引用名统一输出小写文件名，并顺手压缩。
#
# 用法：python scripts/sync-images.py [--quality 82] [--max-size 1600] [--dry-run]
# 依赖：Pillow（仅本地整理时需要，站点构建不依赖本脚本）
# 原始照片始终保留在根目录 images/，不会被修改或删除。

import argparse
import os
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images"
DST = ROOT / "public" / "images"
POSTS = ROOT / "content" / "posts"

# 文章引用名与照片实际文件名不一致的特例。
# 2018-11-15-ymca-holiday.md 写的是 11-15，照片文件是 11-18；
# 已核对照片内容（户外野营、和果子、合影）与该篇正文一致，按同一场活动处理。
ALIASES = {
    "2018-11-15-1.jpg": "2018-11-18-1.JPG",
    "2018-11-15-2.jpg": "2018-11-18-2.JPG",
    "2018-11-15-3.jpg": "2018-11-18-3.JPG",
    "2018-11-15-4.jpg": "2018-11-18-4.JPG",
}


def collect_refs():
    refs = set()
    for post in POSTS.glob("*.md"):
        text = post.read_text(encoding="utf-8")
        for match in re.finditer(r'<img[^>]*src="(/images/[^"]+)"', text):
            refs.add(Path(match.group(1)).name)
    return sorted(refs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--max-size", type=int, default=1600)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not SRC.is_dir():
        raise SystemExit(f"找不到原始照片目录：{SRC}")

    sources = {name.lower(): name for name in os.listdir(SRC)}
    refs = collect_refs()
    DST.mkdir(parents=True, exist_ok=True)

    converted = []
    skipped = []
    missing = []

    for ref in refs:
        target = DST / ref
        if target.exists():
            skipped.append(ref)
            continue

        source_name = ALIASES.get(ref) or sources.get(ref.lower())
        if not source_name or not (SRC / source_name).is_file():
            missing.append(ref)
            continue

        source = SRC / source_name
        if args.dry_run:
            converted.append((ref, source.stat().st_size, 0))
            continue

        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw)
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            image.thumbnail(
                (args.max_size, args.max_size), Image.Resampling.LANCZOS
            )
            if ref.lower().endswith(".png"):
                image.save(target, "PNG", optimize=True)
            else:
                image.save(
                    target,
                    "JPEG",
                    quality=args.quality,
                    optimize=True,
                    progressive=True,
                )

        converted.append((ref, source.stat().st_size, target.stat().st_size))

    before = sum(x[1] for x in converted) / 1024 / 1024
    after = sum(x[2] for x in converted) / 1024 / 1024
    print(f"文章引用图片：{len(refs)} 个")
    print(f"已存在无需处理：{len(skipped)} 个")
    print(f"本次生成：{len(converted)} 个  {before:.1f} MB → {after:.1f} MB")
    if missing:
        print(f"仍缺源文件的引用（{len(missing)} 个）：")
        for name in missing:
            print(f"  {name}")
    else:
        print("全部引用均已在 public/images/ 落地")


if __name__ == "__main__":
    main()
