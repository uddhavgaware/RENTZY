import asyncio
from playwright.async_api import async_playwright
import os
import pathlib

async def generate_pdfs():
    base_dir = r"c:\Users\Uddhav\Downloads\sem 2\edc"
    files = [
        "Unit6_PLL.html",
        "Unit4_Rectifiers_and_Filters.html"
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        for file in files:
            html_path = os.path.join(base_dir, file)
            file_uri = pathlib.Path(html_path).as_uri()
            
            pdf_filename = file.replace(".html", ".pdf")
            pdf_path = os.path.join(base_dir, pdf_filename)
            
            print(f"Loading {file_uri} ...")
            await page.goto(file_uri, wait_until="networkidle")
            
            # Additional wait to ensure MathJax renders completely
            await page.wait_for_timeout(3000)
            
            print(f"Saving to {pdf_filename} ...")
            await page.pdf(
                path=pdf_path,
                format="A4",
                margin={"top": "15mm", "bottom": "15mm", "left": "15mm", "right": "15mm"},
                print_background=True
            )
            print(f"Done: {pdf_filename}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(generate_pdfs())
