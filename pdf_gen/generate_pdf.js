const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Load the HTML file
    const filePath = `file://${path.resolve(__dirname, 'team.html')}`;
    console.log(`Navigating to ${filePath}`);
    
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    console.log("Generating PDF...");
    await page.pdf({
        path: 'Rentzy_Team.pdf',
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px'
        }
    });

    console.log("PDF generated successfully at Rentzy_Team.pdf");
    await browser.close();
})();
