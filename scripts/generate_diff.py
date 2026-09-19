import sys
from PIL import Image, ImageChops

def process_screen(ref_path, cur_path, out_sbs, out_overlay, out_diff, width, height):
    try:
        ref = Image.open(ref_path).convert('RGB').resize((width, height), Image.Resampling.LANCZOS)
        cur = Image.open(cur_path).convert('RGB').resize((width, height), Image.Resampling.LANCZOS)
        
        # 1. Side by side
        sbs = Image.new('RGB', (width * 2, height))
        sbs.paste(ref, (0, 0))
        sbs.paste(cur, (width, 0))
        sbs.save(out_sbs)
        
        # 2. Overlay 50%
        overlay = Image.blend(ref, cur, 0.5)
        overlay.save(out_overlay)
        
        # 3. Difference
        diff = ImageChops.difference(ref, cur)
        diff.save(out_diff)
        
        print(f"✓ Generated: {out_sbs}, {out_overlay}, {out_diff}")
    except Exception as e:
        print(f"Error processing {ref_path} and {cur_path}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 8:
        print("Usage: python3 generate_diff.py ref cur sbs overlay diff width height")
        sys.exit(1)
    process_screen(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], int(sys.argv[6]), int(sys.argv[7]))
