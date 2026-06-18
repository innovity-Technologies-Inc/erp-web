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
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add imports
  if (!content.includes("from './constants'")) {
    content = content.replace(
      "import { useUiStore } from '@/store/useUiStore'",
      "import { useUiStore } from '@/store/useUiStore'\nimport { salesReportOptions, reportCategoryTabs } from './constants'"
    );
  }

  // 2. Remove TabDropdown import
  content = content.replace(/import \{ TabDropdown \} from '\.\/components\/TabDropdown'\n?/g, '');
  content = content.replace(/import \{ TabDropdown \} from '\.\.\/components\/TabDropdown'\n?/g, '');

  // 3. Remove local salesReportOptions if exists
  content = content.replace(/const salesReportOptions = \[[^\]]*\]\n\n?/g, '');

  // 4. Update ListPageLayout props
  content = content.replace(
    /customHeaderRight=\{headerRight\}/g,
    'titleOptions={salesReportOptions}\n      tabs={reportCategoryTabs}'
  );

  // 5. Remove headerRight constant definition
  // It usually looks like: const headerRight = (\n  <div ... \n  </div>\n)\n
  // Let's use a regex to match it.
  const headerRightRegex = /const headerRight = \([\s\S]*?className="flex items-center gap-3"[\s\S]*?<\/div>\n  \)\n\n?/g;
  content = content.replace(headerRightRegex, '');

  // Alternate headerRight regex just in case
  const headerRightRegex2 = /const headerRight = \([\s\S]*?<\/div>\n  \)\n\n/g;
  if(content.includes('const headerRight = (')) {
     const startIndex = content.indexOf('const headerRight = (');
     const endIndex = content.indexOf('  )', startIndex);
     if (startIndex !== -1 && endIndex !== -1) {
         content = content.substring(0, startIndex) + content.substring(endIndex + 4);
     }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${fileName}`);
});
