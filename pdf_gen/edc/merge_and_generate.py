import os
import re
import asyncio
from playwright.async_api import async_playwright
import pathlib

async def generate_merged_pdf():
    base_dir = r"c:\Users\Uddhav\Downloads\sem 2\edc"
    
    files = [
        "Unit3_Voltage_Regulators.html",
        "Unit4_Rectifiers_and_Filters.html",
        "Unit6_PLL.html"
    ]
    
    combined_body = ""
    for file in files:
        with open(os.path.join(base_dir, file), "r", encoding="utf-8") as f:
            content = f.read()
            body_match = re.search(r"<body.*?>(.*?)</body>", content, re.DOTALL | re.IGNORECASE)
            if body_match:
                combined_body += f"<div style='margin-bottom: 2px;'>{body_match.group(1)}</div>"
            else:
                combined_body += f"<div style='margin-bottom: 2px;'>{content}</div>"

    merged_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cheat Sheet Compressed</title>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&family=Inter:wght@400;600;700&display=swap');
    * {{ box-sizing: border-box; }}
    body {{ font-family: 'Inter', sans-serif; line-height: 1.0; margin: 0; padding: 1px; color: #000; font-size: 3px; background: #fff; }}
    h1 {{ text-align: center; color: #000; font-size: 4px; font-weight: 700; border-bottom: 0.5px solid #ccc; padding-bottom: 1px; margin-bottom: 2px; margin-top: 2px; }}
    .question-block {{ margin-bottom: 2px; padding: 1px; border: 0.5px solid #ccc; background: #fff; box-shadow: none; }}
    .question {{ font-family: 'Roboto Mono', monospace; font-weight: 600; font-size: 3.5px; color: #000; margin-bottom: 1px; border-left: 1px solid #000; padding-left: 2px; }}
    .solution {{ padding-left: 1px; }}
    .step {{ margin-bottom: 1px; padding-bottom: 1px; border-bottom: 0.5px dashed #ccc; }}
    .step:last-child {{ border-bottom: none; }}
    .step-explain {{ color: #222; font-size: 3px; font-weight: bold; margin-bottom: 1px; display: block; }}
    .theory-list {{ margin: 1px 0; padding-left: 4px; }}
    .theory-list li {{ margin-bottom: 1px; color: #000; }}
    .theory-list strong {{ color: #000; }}
    .graph-container {{ text-align: center; margin: 2px 0; padding: 2px; background: #fff; border: 0.5px solid #ccc; border-radius: 1px; }}
    .graph-title {{ font-family: 'Roboto Mono', monospace; font-size: 3px; color: #000; margin-bottom: 1px; }}
    p {{ margin-top: 0; margin-bottom: 1px; }}
    .marks-tag {{ display: inline-block; background: #eee; color: #000; font-size: 2.5px; font-weight: 700; padding: 0.5px 1px; border-radius: 1px; margin-left: 2px; border: 0.5px solid #ccc; }}
</style>
</head>
<body>
{combined_body}
</body>
</html>"""

    merged_html_path = os.path.join(base_dir, "All_Units_Cheat.html")
    with open(merged_html_path, "w", encoding="utf-8") as f:
        f.write(merged_html)

    # Generate PDF
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        file_uri = pathlib.Path(merged_html_path).as_uri()
        pdf_path = os.path.join(base_dir, "Cheat_Sheet_3x4cm.pdf")
        
        print(f"Loading {file_uri} ...")
        await page.goto(file_uri, wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        print(f"Saving to Cheat_Sheet_3x4cm.pdf ...")
        await page.pdf(
            path=pdf_path,
            width="3cm",
            height="4cm",
            margin={"top": "1mm", "bottom": "1mm", "left": "1mm", "right": "1mm"},
            print_background=True
        )
        print(f"Done: Cheat_Sheet_3x4cm.pdf")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(generate_merged_pdf())
