from PIL import Image, ImageDraw

def draw_ellipse(img_path, regions, output_path=None):
    if output_path is None:
        output_path = img_path
    
    img = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    for r in regions:
        x0, y0, x1, y1 = r
        # Draw red ellipse with a width of 4 pixels
        # A bright modern red color: rgb(239, 68, 68)
        draw.ellipse([x0, y0, x1, y1], outline=(239, 68, 68), width=4)
        
    img.save(output_path)
    print(f"Saved highlighted image to {output_path}")

# 1. 02_listado_pedidos.png: "+ Nuevo Pedido" button
draw_ellipse(
    "docs/images/02_listado_pedidos.png",
    [(1025, 230, 1238, 297)]
)

# 2. 03_nuevo_pedido.png:
# - "Cargar último pedido" (645, 245) to (810, 285)
# - "+ Agregar" (1045, 370) to (1248, 429)
# - "Confirmar" (1114, 635) to (1248, 700)
draw_ellipse(
    "docs/images/03_nuevo_pedido.png",
    [
        (645, 245, 810, 285),     # Cargar último pedido
        (1045, 370, 1248, 429),   # + Agregar
        (1114, 635, 1248, 700)    # Confirmar
    ]
)
