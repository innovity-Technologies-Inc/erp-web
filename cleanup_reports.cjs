const fs = require('fs');
const path = require('path');

const targetDir = 'src/modules/inventory/views/reports';
const filesToProcess = [
  'CategoryWiseSalesReportPage.tsx',
  'InvoiceWiseDueReportPage.tsx',
  'MerchantWiseSalesReportPage.tsx',
  'ProductWiseSalesReportPage.tsx',
  'SaleWiseProfitReportPage.tsx',
  'ShippingCostReportPage.tsx',
  'UserWiseSalesReportPage.tsx'
];

filesToProcess.forEach(fileName => {
  const filePath = path.join(targetDir, fileName);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove unused Link import (but only if it's the exact line "import { Link } from '@tanstack/react-router'")
  // We need to be careful as some pages might still use Link for other things, but the TS error says it's never read.
  content = content.replace(/import \{ Link \} from '@tanstack\/react-router'\n?/g, '');

  // 2. Remove conflicting salesReportOptions. Our previous regex `const salesReportOptions = \[[^\]]*\]\n\n?` might have failed
  // due to nested structures or formatting. Let's use a more robust replacement.
  if (content.includes('const salesReportOptions = [')) {
    const startIndex = content.indexOf('const salesReportOptions = [');
    let bracketCount = 0;
    let i = startIndex;
    for (; i < content.length; i++) {
        if (content[i] === '[') bracketCount++;
        else if (content[i] === ']') bracketCount--;
        
        if (bracketCount === 0 && content[i] === ']') {
            i++; // Move past the closing bracket
            break;
        }
    }
    const endIndex = i;
    // Also remove any following newlines
    let removeEnd = endIndex;
    while(content[removeEnd] === '\r' || content[removeEnd] === '\n') removeEnd++;
    
    content = content.substring(0, startIndex) + content.substring(removeEnd);
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Cleanup script completed.');
