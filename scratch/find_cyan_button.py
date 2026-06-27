from PIL import Image

def find_cyan_regions(img_path):
    img = Image.open(img_path).convert("RGB")
    width, height = img.size
    print(f"Image {img_path} size: {width}x{height}")
    
    # Target cyan: rgb(103, 232, 249) -> hex #67e8f9, or rgb(23, 162, 184) -> hex #17a2b8
    target_colors = [(103, 232, 249), (23, 162, 184)]
    tolerance = 25
    
    cyan_pixels = []
    for y in range(height):
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            for tr, tg, tb in target_colors:
                if abs(r - tr) <= tolerance and abs(g - tg) <= tolerance and abs(b - tb) <= tolerance:
                    cyan_pixels.append((x, y))
                    break
                
    if not cyan_pixels:
        print("No cyan pixels found.")
        return
        
    print(f"Found {len(cyan_pixels)} cyan pixels.")
    clusters = []
    for px in cyan_pixels:
        added = False
        for c in clusters:
            min_x, min_y, max_x, max_y = c["bounds"]
            if min_x - 50 <= px[0] <= max_x + 50 and min_y - 50 <= px[1] <= max_y + 50:
                c["pixels"].append(px)
                c["bounds"] = (min(min_x, px[0]), min(min_y, px[1]), max(max_x, px[0]), max(max_y, px[1]))
                added = True
                break
        if not added:
            clusters.append({
                "pixels": [px],
                "bounds": (px[0], px[1], px[0], px[1])
            })
            
    print(f"Found {len(clusters)} clusters:")
    for idx, c in enumerate(clusters):
        min_x, min_y, max_x, max_y = c["bounds"]
        w = max_x - min_x + 1
        h = max_y - min_y + 1
        if w > 5 and h > 5:
            print(f"Cluster {idx}: bounds ({min_x}, {min_y}) to ({max_x}, {max_y}), size {w}x{h}, center ({min_x + w//2}, {min_y + h//2})")

find_cyan_regions("docs/images/03_nuevo_pedido.png")
