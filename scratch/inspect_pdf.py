import sys
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')
reader = PdfReader("Manual_Usuario_Distribuidora.pdf")
print(f"Total pages: {len(reader.pages)}")

for i, page in enumerate(reader.pages):
    text = page.extract_text()
    print(f"\n--- PAGE {i+1} ---")
    if not text.strip():
        print("[EMPTY PAGE]")
    else:
        # print first few lines of the text
        lines = text.split('\n')
        for line in lines[:10]:
            print(f"  {line}")
        if len(lines) > 10:
            print(f"  ... ({len(lines) - 10} more lines)")
