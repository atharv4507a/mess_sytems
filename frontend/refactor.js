import fs from 'fs';
import path from 'path';

const translations = {
  // Navigation / Common
  'सदस्य': 'Members',
  'नवीन सदस्य': 'New Member',
  'सक्रिय': 'Active',
  'निष्क्रिय': 'Inactive',
  'एकूण': 'Total',
  'मासिक मेस': 'Monthly Mess',
  'मासिक': 'Monthly',
  'टिफिन': 'Tiffin',
  'टिफिन एंट्री': 'Tiffin Entry',
  'सुट्टी एंट्री': 'Leave Entry',
  'बिल': 'Bills',
  'खर्च': 'Expenses',
  'मेस व्यवस्थापन': 'Mess Management',
  'सर्व': 'All',

  // Dashboard
  'एकूण सदस्य': 'Total Members',
  'एकूण जमा': 'Total Collection',
  'या महिन्यात': 'This Month',
  'बाकी रक्कम': 'Pending Amount',
  'मासिक खर्च': 'Monthly Expense',
  'नफ्यात': 'In Profit',
  'तोट्यात': 'In Loss',
  'पूर्ण': 'Paid',
  'अंशतः': 'Partial',
  'बाकी': 'Pending',
  'स्वागत आहे! तुमच्या मेसचा आढावा.': 'Welcome! Overview of your mess.',
  'जमा vs खर्च': 'Collection vs Expense',
  'बिल स्थिती': 'Bill Status',
  'अलीकडील Payments': 'Recent Payments',
  'सर्व पहा': 'View All',
  'अजून payments नाहीत': 'No recent payments',
  'बाकी बिल': 'Pending Bills',
  'बाकी बिल नाहीत': 'No pending bills',
  'जमा': 'Collection',
  'या महिन्याचा तोटा': "This month's Loss",
  'या महिन्याचा नफा': "This month's Profit",

  // Members
  'मेस सदस्यांचे व्यवस्थापन': 'Mess members management',
  'कोणतेही सदस्य सापडले नाहीत': 'No members found',
  'नाव, मोबाईल, पत्ता शोधा...': 'Search name, mobile, address...',
  'पालक:': 'Parent:',
  '/महिना': '/month',
  '/टिफिन': '/tiffin',
  'सदस्य संपादित करा': 'Edit Member',
  'नाव *': 'Name *',
  'सदस्याचे नाव': 'Member Name',
  'मोबाईल नंबर *': 'Mobile Number *',
  '10 अंकी मोबाईल नंबर': '10 digit mobile number',
  'पालकांचा मोबाईल नंबर': 'Parent Mobile Number',
  '(ऐच्छिक)': '(Optional)',
  'पत्ता *': 'Address *',
  'संपूर्ण पत्ता': 'Complete Address',
  'मेस प्रकार *': 'Mess Type *',
  'मासिक दर (₹) *': 'Monthly Rate (₹) *',
  'प्रति टिफिन दर (₹) *': 'Per Tiffin Rate (₹) *',
  'सामील तारीख': 'Joining Date',
  'स्थिती': 'Status',
  'रद्द करा': 'Cancel',
  'अपडेट करा': 'Update',
  'जोडा': 'Add',
  'सदस्य काढायचा आहे?': 'Remove member?',
  'ही क्रिया परत करता येणार नाही.': 'This action cannot be undone.',
  'काढा': 'Remove',

  // Tiffin Entry
  'दररोज टिफिन count टाका': 'Enter daily tiffin count',
  'आजचे एकूण टिफिन': "Today's Total Tiffins",
  'सेव्ह झाले!': 'Saved!',
  'सेव्ह करा': 'Save',
  'कोणतेही टिफिन सदस्य नाहीत': 'No tiffin members',
  
  // Others / Remaining known texts
  'सुट्टीची नोंद': 'Leave Records',
  'दररोजची सुट्टी नोंदवा': 'Log daily leaves',
  'सुट्टीचे दिवस': 'Leave Days',
  'या महिन्याची सुट्टी नोंद': 'This month leave records',
  'सुट्टी नाही': 'No leaves',
  'नवीन बिल': 'New Bill',
  'रक्कम': 'Amount',
  'नाव': 'Name',
  'माहिती': 'Details',
  'तारीख': 'Date',
  'पद्धत': 'Method',
  'पेमेंट करावे': 'Make Payment',
  'शेवटचा हप्ता': 'Last Installment',
  'भरलेली रक्कम': 'Paid Amount',
  'प्रिंट काढा': 'Print',
  'बिल जनरेट करा': 'Generate Bill',
  'पूर्ण बिल': 'Full Bill',
  'नवीन खर्च': 'New Expense',
  'खर्चाचे प्रकार': 'Expense Category',
  'कोणताही खर्च नाही': 'No expenses',
  'येथे टॅप करा': 'Tap here',
  'शोध...': 'Search...',
  'निवडा': 'Select',
  'सुट्ट्या': 'Leaves',
  'एकूण बिल': 'Total Bill',
  'तपशील': 'Details'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Basic Typescript removal
      content = content.replace(/import type {[^}]+} from ['"][^'"]+['"];?\s*/g, '');
      content = content.replace(/:\s*React\.FormEvent/g, '');
      content = content.replace(/:\s*React\.ChangeEvent<[^>]+>/g, '');
      content = content.replace(/<Record<string, number>>/g, '');
      content = content.replace(/<Member \| null>/g, '');
      content = content.replace(/<string \| null>/g, '');
      content = content.replace(/<[a-zA-Z]+ \| [a-zA-Z]+>/g, '');
      content = content.replace(/ as 'active' \| 'inactive'/g, '');
      content = content.replace(/ as 'monthly' \| 'tiffin'/g, '');
      content = content.replace(/:\s*Record<string,\s*number>/g, '');
      
      // Specifically remove type definitions from parameter maps if possible 
      content = content.replace(/\(date: string\)/g, '(date)');
      content = content.replace(/\(memberId: string\)/g, '(memberId)');
      content = content.replace(/\(query: string\)/g, '(query)');
      content = content.replace(/\(id: string\)/g, '(id)');
      content = content.replace(/\(month: string\)/g, '(month)');
      
      // We must avoid breaking TS syntax that might not be fully caught, but Vite's esbuild skips JS parsing errors inside JSX often if simply extension renamed? No, EsBuild will fail if we have `member: Member` inside JSX.
      content = content.replace(/\(member:\s*Member\)/g, '(member)');
      content = content.replace(/\(bill:\s*MonthlyBill\)/g, '(bill)');
      content = content.replace(/\(payment:\s*Payment\)/g, '(payment)');
      content = content.replace(/\(expense:\s*Expense\)/g, '(expense)');
      content = content.replace(/\(log:\s*TiffinLog\)/g, '(log)');
      content = content.replace(/\(record:\s*LeaveRecord\)/g, '(record)');
      content = content.replace(/:\s*MonthlyBill/g, '');

      // Translate strings
      for (let marathi of Object.keys(translations)) {
        let english = translations[marathi];
        let regex = new RegExp(marathi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, english);
      }
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

// Ensure execution directory is correct
processDirectory('d:/classess/mess_sytem/src/pages');
processDirectory('d:/classess/mess_sytem/src/components');
