import { ExpenseCategory, Transaction } from '../types';
import { uid } from '../utils';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
}

// Simple rule-based categorizer for auto-mapping
const KEYWORD_RULES: Record<string, string[]> = {
  'groceries': ['king soopers', 'nespresso', 'safeway', 'kroger', 'publix', 'albertsons'],
  'personal': ['amazon', 'target', 'coffee', 'personal'],
  'communication': ['att', 'at&t', 'verizon', 't-mobile'],
  'baby': ['brghtwhl', 'brightwheel'],
  'travel': ['loaf n jug', 'shell', 'parking', 'hotel', 'airbnb', 'delta', 'united', 'american airlines', 'southwest', 'expedia', 'uber', 'lyft'],
  'entertainment': ['apple.com', 'southwe', 'sushi', 'wow presents', 'netflix', 'spotify', 'hulu', 'disney+', 'hbo', 'amc', 'regal', 'steam', 'xbox', 'playstation'],
  'stores': ['walgreens', 'cvs', 'wal-mart', 'walmart', 'target', 'costco', 'sams club'],
  'dogs': ['veterinary', 'vetsource'],
  'fitness': ['fitness', 'gym'],
  'transportation': ['maverik', 'chevron', 'exxon', 'mobil', 'bp', 'wawa', 'speedway', 'gas', 'fuel'],
  'food': ['mcdonalds', 'starbucks', 'subway', 'wendys', 'taco bell', 'burger king', 'restaurant', 'dining'],
  'shopping': ['best buy', 'home depot', 'lowes'],
  'utilities': ['pg&e', 'conedison', 'comcast', 'xfinity', 'water', 'electric', 'power'],
};

export function getSuggestedCategoryName(description: string): string | null {
  const descLower = description.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(KEYWORD_RULES)) {
    if (keywords.some(kw => descLower.includes(kw))) {
      // Return the capitalized topic name as the suggested category name
      return topic.charAt(0).toUpperCase() + topic.slice(1);
    }
  }
  return null;
}

function getSuggestedCategory(description: string, categories: ExpenseCategory[]): string | null {
  const suggestedName = getSuggestedCategoryName(description);
  if (!suggestedName) return null;

  const matchingCat = categories.find(c => c.name.toLowerCase() === suggestedName.toLowerCase());
  return matchingCat ? matchingCat.id : null;
}

export async function parseChaseStatement(file: File, categories: ExpenseCategory[]): Promise<ParsedTransaction[]> {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("PDF parser library not loaded yet. Please try again.");
  }
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullTextContext = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items.map((item: any) => item.str.trim()).filter((str: string) => str.length > 0);
    fullTextContext.push(...items);
  }

  const transactions: ParsedTransaction[] = [];
  const dateRegex = /^\d{2}\/\d{2}$/;
  const year = new Date().getFullYear();
  
  for (let i = 0; i < fullTextContext.length; i++) {
    const str = fullTextContext[i];
    
    if (dateRegex.test(str)) {
      let offset = 1;
      if (i + offset < fullTextContext.length && dateRegex.test(fullTextContext[i + offset])) {
        offset++;
      }
      
      let description = '';
      while (i + offset < fullTextContext.length) {
        const nextStr = fullTextContext[i + offset];
        if (/^-?\$?[\d,]+\.\d{2}$/.test(nextStr)) {
          const amountStr = nextStr.replace(/[$,]/g, '');
          const amount = parseFloat(amountStr);
          
          if (!isNaN(amount) && description.trim().length > 0) {
            if (amount > 0) {
                const [mm, dd] = str.split('/');
                transactions.push({
                  id: uid(),
                  date: `${year}-${mm}-${dd}`,
                  description: description.trim(),
                  amount: amount,
                  suggestedCategoryId: getSuggestedCategory(description, categories),
                  suggestedCategoryName: getSuggestedCategoryName(description)
                });
            }
            i += offset;
            break;
          }
        } else if (dateRegex.test(nextStr)) {
          break;
        } else {
          description += ' ' + nextStr;
        }
        offset++;
        if (offset > 15) break;
      }
    }
  }

  return transactions;
}


export function parseYearlySummaryText(text: string, defaultDate: string, categories: ExpenseCategory[]): ParsedTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const transactions: ParsedTransaction[] = [];

  // Try format 1: "HomeShow details\n$31,932.20\t46%"
  // We can look for "$XX,XXX.XX" format.

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if it's the summarized format
    if (line.includes('Show details')) {
      const categoryName = line.replace('Show details', '').trim();
      if (i + 1 < lines.length) {
        const nextLine = lines[i+1];
        const match = nextLine.match(/\$([\d,]+\.\d{2})/);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          transactions.push({
            id: uid(),
            date: defaultDate,
            description: `Summary - ${categoryName}`,
            amount: amount,
            suggestedCategoryId: null, // We'll handle matching in the UI
            suggestedCategoryName: categoryName
          });
          i += 2;
          continue;
        }
      }
    }

    // Check format 2: raw tab/space separated
    // Dec 31, 2025   BRGHTWHL H* HEALTH SOL   CREDIT CARD (...5993)   Personal   $75.00
    // We can try a regex for a line starting with a date and ending with an amount
    const rawMatch = line.match(/^([A-Z][a-z]{2} \d{1,2}, \d{4})\s+(.+)\s+\$([\d,]+\.\d{2})$/);
    if (rawMatch) {
      const dateStr = rawMatch[1];
      const descAndCat = rawMatch[2]; // Contains description, account, category
      const amount = parseFloat(rawMatch[3].replace(/,/g, ''));

      const d = new Date(dateStr);
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Try to split the description and category by looking for keywords or double spacing
      // But actually, getSuggestedCategoryName might be robust enough

      transactions.push({
        id: uid(),
        date: formattedDate,
        description: descAndCat.trim(), // Will contain extra stuff, but that's okay
        amount: amount,
        suggestedCategoryId: null,
        suggestedCategoryName: getSuggestedCategoryName(descAndCat)
      });
      i++;
      continue;
    }

    i++;
  }

  return transactions;
}
