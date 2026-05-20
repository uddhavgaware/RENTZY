const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'frontend/src/pages/DashboardPage.jsx',
  'frontend/src/pages/ListingDetailsPage.jsx',
  'frontend/src/pages/FlatRentalPortal.jsx',
  'frontend/src/pages/RoommatesPage.jsx',
  'frontend/src/pages/PostPropertyPage.jsx',
  'frontend/src/pages/AdminDashboardPage.jsx',
  'frontend/src/components/ListingCard.jsx'
];

const replacements = [
  { regex: /text-gray-900(?! dark:text-white)/g, replacement: 'text-gray-900 dark:text-white' },
  { regex: /bg-white(?! dark:bg-slate-900)(?! dark:bg-slate-800)(?! dark:bg-slate-700)/g, replacement: 'bg-white dark:bg-slate-800' },
  { regex: /text-gray-500(?! dark:text-gray-400)/g, replacement: 'text-gray-500 dark:text-gray-400' },
  { regex: /text-gray-800(?! dark:text-gray-200)(?! dark:text-white)/g, replacement: 'text-gray-800 dark:text-gray-200' },
  { regex: /text-gray-700(?! dark:text-gray-300)/g, replacement: 'text-gray-700 dark:text-gray-300' },
  { regex: /text-gray-600(?! dark:text-gray-400)(?! dark:text-gray-300)/g, replacement: 'text-gray-600 dark:text-gray-400' },
  { regex: /bg-gray-50(?! dark:bg-slate-700)(?! dark:bg-slate-800)/g, replacement: 'bg-gray-50 dark:bg-slate-700' },
  { regex: /bg-gray-100(?! dark:bg-slate-800)(?! dark:bg-slate-700)/g, replacement: 'bg-gray-100 dark:bg-slate-700' },
  { regex: /border-gray-100(?! dark:border-slate-700)(?! dark:border-white\/5)(?! dark:border-white\/10)/g, replacement: 'border-gray-100 dark:border-slate-700' },
  { regex: /border-gray-200(?! dark:border-slate-600)(?! dark:border-white\/10)/g, replacement: 'border-gray-200 dark:border-slate-600' },
  { regex: /border-gray-300(?! dark:border-slate-600)/g, replacement: 'border-gray-300 dark:border-slate-600' },
  { regex: /bg-gray-200(?! dark:bg-slate-600)/g, replacement: 'bg-gray-200 dark:bg-slate-600' },
];

let totalUpdated = 0;

for (const fileRelPath of filesToUpdate) {
  const filePath = path.join(__dirname, fileRelPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found, skipping: ${fileRelPath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const r of replacements) {
    content = content.replace(r.regex, r.replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${fileRelPath}`);
    totalUpdated++;
  } else {
    console.log(`No changes needed for ${fileRelPath}`);
  }
}

console.log(`\nDone! Successfully added dark mode utility classes to ${totalUpdated} files.`);
