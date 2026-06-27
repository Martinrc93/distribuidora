from PIL import Image

def find_blue_regions(img_path):
    img = Image.open(img_path).convert("RGB")
    width, height = img.size
    print(f"Image {img_path} size: {width}x{height}")
    
    # Target blue: rgb(37, 99, 235) -> hex #2563eb
    # Let's allow a small tolerance around it
    target_r, target_g, target_b = 37, 99, 235
    tolerance = 15
    
    blue_pixels = []
    for y in range(height):
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            if abs(r - target_r) <= tolerance and abs(g - target_g) <= tolerance and abs(b - target_b) <= tolerance:
                blue_pixels.append((x, y))
                
    if not blue_pixels:
        print("No blue pixels found.")
        return
        
    print(f"Found {len(blue_pixels)} blue pixels.")
    # Group them into connected components or just find their min/max bounds
    # Since there might be multiple blue buttons (especially in the modal), let's list clusters
    # Quick clustering: pixels within 50px of each other belong to the same button
    clusters = []
    for px in blue_pixels:
        added = False
        for c in clusters:
            # check distance to any pixel in the cluster
            # for speed, check distance to the bounding box of the cluster
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
        # Filter out tiny clusters (noise or small icons)
        if w > 5 and h > 5:
            print(f"Cluster {idx}: bounds ({min_x}, {min_y}) to ({max_x}, {max_y}), size {w}x{h}, center ({min_x + w//2}, {min_y + h//2})")

print("--- 02_listado_pedidos.png ---")
find_blue_regions("docs/images/02_listado_pedidos.png")
print("\n--- 03_nuevo_pedido.png ---")
find_blue_regions("docs/images/03_nuevo_pedido.png")
