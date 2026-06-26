import sys
sys.path.insert(0, r'C:\Users\Uddhav\AppData\Roaming\Python\Python313\site-packages')

from weasyprint import HTML

html_path = r'C:\Users\Uddhav\OneDrive\Desktop\RENTZY\Q12_RLC_Series_Circuit.html'
pdf_path  = r'C:\Users\Uddhav\OneDrive\Desktop\RENTZY\Q12_RLC_Series_Circuit.pdf'

HTML(filename=html_path).write_pdf(pdf_path)
print(f"PDF saved to: {pdf_path}")
