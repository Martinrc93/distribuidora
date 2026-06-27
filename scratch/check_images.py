from pypdf import PdfReader

reader = PdfReader("Manual_Usuario_Distribuidora.pdf")

for i, page in enumerate(reader.pages):
    images = page.images
    print(f"Page {i+1} has {len(images)} images")
    for img_name in images:
        print(f"  - Image name: {img_name}")
