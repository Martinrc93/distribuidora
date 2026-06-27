import os
import re
import subprocess
import markdown

def main():
    # Read Markdown content
    md_file = 'MANUAL_USUARIO_CON_IMAGENES.md'
    if not os.path.exists(md_file):
        print(f"Error: {md_file} not found.")
        return
        
    with open(md_file, 'r', encoding='utf-8') as f:
        text = f.read()

    # Pre-process markdown for GitHub-style alerts
    text = text.replace("> [!NOTE]", "> 💡 **Nota:**")
    text = text.replace("> [!TIP]", "> 💡 **Consejo:**")
    text = text.replace("> [!IMPORTANT]", "> ⚠️ **Importante:**")
    text = text.replace("> [!WARNING]", "> ⚠️ **Advertencia:**")

    # Convert markdown to html using extra extension for tables, code blocks, etc.
    html_content = markdown.markdown(text, extensions=['extra'])

    # Post-process HTML to convert relative image paths to absolute file URLs
    base_dir = os.path.abspath(os.path.dirname(__file__) or '.')
    
    def replace_img_tag(match):
        tag = match.group(0)
        src_match = re.search(r'src="([^"]+)"', tag)
        alt_match = re.search(r'alt="([^"]+)"', tag)
        
        if not src_match:
            return tag
            
        rel_path = src_match.group(1)
        alt_text = alt_match.group(1) if alt_match else "Captura de pantalla"
        
        normalized_rel = rel_path.lstrip('./').replace('/', os.sep)
        abs_path = os.path.abspath(os.path.join(base_dir, '..', normalized_rel))
        filename = os.path.basename(abs_path)
        
        if os.path.exists(abs_path):
            file_url = f"file:///{abs_path.replace(os.sep, '/')}"
            return f'<img alt="{alt_text}" src="{file_url}" />'
        else:
            # File does not exist, render a clean placeholder block
            return f"""<div class="image-placeholder">
                <div class="placeholder-icon">📷</div>
                <div class="placeholder-title">{alt_text}</div>
                <div class="placeholder-desc">Para mostrar esta imagen, guardá la captura de pantalla en: <code>docs/images/{filename}</code></div>
            </div>"""

    html_content = re.sub(r'<img[^>]+>', replace_img_tag, html_content)

    # Build HTML document with premium design styles
    full_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Manual de Usuario - Distribuidora</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {{
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 20px;
            background-color: #ffffff;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
        }}
        h1, h2, h3 {{
            color: #0f172a;
            font-weight: 700;
        }}
        h1 {{
            font-size: 2.2rem;
            color: #1e3a8a;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 12px;
            margin-top: 0;
            text-align: center;
        }}
        h2 {{
            font-size: 1.6rem;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
            margin-top: 40px;
            color: #1e3a8a;
            page-break-before: always;
        }}
        h2:first-of-type {{
            page-break-before: avoid;
            margin-top: 20px;
        }}
        h3 {{
            font-size: 1.25rem;
            color: #334155;
            margin-top: 25px;
        }}
        p, li {{
            font-size: 14px;
            color: #475569;
        }}
        li {{
            margin-bottom: 8px;
        }}
        img {{
            max-width: 90%;
            height: auto;
            display: block;
            margin: 25px auto;
            border-radius: 10px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #cbd5e1;
        }}
        blockquote {{
            background-color: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 6px;
        }}
        blockquote p {{
            margin: 0;
            font-size: 14px;
            color: #1e293b;
        }}
        .image-placeholder {{
            border: 2px dashed #cbd5e1;
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px 16px;
            text-align: center;
            margin: 25px auto;
            max-width: 80%;
            page-break-inside: avoid;
        }}
        .placeholder-icon {{
            font-size: 24px;
            margin-bottom: 6px;
        }}
        .placeholder-title {{
            font-weight: 600;
            color: #475569;
            font-size: 14px;
            margin-bottom: 4px;
        }}
        .placeholder-desc {{
            color: #64748b;
            font-size: 12px;
        }}
        .placeholder-desc code {{
            background-color: #e2e8f0;
            color: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: Consolas, monospace;
        }}
        /* Keep page breaks clean when printing */
        h2, h3 {{
            page-break-after: avoid;
        }}
        img {{
            page-break-inside: avoid;
        }}
        hr {{
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 30px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        {html_content}
    </div>
</body>
</html>
"""

    temp_html = 'manual_temp.html'
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(full_html)
        
    print(f"Generated temporary HTML at: {os.path.abspath(temp_html)}")

    # Write Electron script
    electron_script = 'scratch/print_pdf_electron.js'
    script_content = f"""const {{ app, BrowserWindow }} = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {{
  try {{
    const win = new BrowserWindow({{ show: false }});
    const htmlPath = 'file:///' + path.resolve(__dirname, '../manual_temp.html').replace(/\\\\/g, '/');
    await win.loadURL(htmlPath);
    
    const options = {{
      margins: {{
        top: 0.4,
        bottom: 0.6,
        left: 0.6,
        right: 0.6
      }},
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 1px; color: transparent;"></div>',
      footerTemplate: '<div style="font-size: 10px; font-family: \\'Outfit\\', sans-serif; text-align: center; width: 100%; color: #64748b; padding-bottom: 5px;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
      pageSize: 'A4'
    }};

    const data = await win.webContents.printToPDF(options);
    const pdfPath = path.resolve(__dirname, '../Manual_Usuario_Distribuidora.pdf');
    fs.writeFileSync(pdfPath, data);
    console.log('PDF successfully generated at: ' + pdfPath);
  }} catch (error) {{
    console.error('Failed to generate PDF:', error);
  }} finally {{
    app.quit();
  }}
}});
"""
    with open(electron_script, 'w', encoding='utf-8') as f:
        f.write(script_content)

    print("Executing PDF generation via Electron...")
    try:
        # Run electron via npx (use shell=True on Windows for command resolution)
        cmd = ["npx", "electron", "scratch/print_pdf_electron.js"]
        subprocess.run(cmd, check=True, shell=True)
        print("Electron execution finished.")
    except Exception as e:
        print(f"Error executing Electron: {e}")
    finally:
        # Cleanup temp files
        # if os.path.exists(temp_html):
        #     os.remove(temp_html)
        # if os.path.exists(electron_script):
        #     os.remove(electron_script)
        pass

if __name__ == "__main__":
    main()
