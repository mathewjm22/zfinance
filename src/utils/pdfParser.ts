import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { ExpenseCategory, Transaction } from '../types';
import { uid } from '../utils';

// Point to the CDN worker to prevent Vite bundling issues with the worker thread
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  suggestedCategoryId: string | null;
}

// Simple rule-based categorizer for auto-mapping
const KEYWORD_RULES: Record<string, string[]> = {
  'travel': ['hotel', 'airbnb', 'delta', 'united', 'american airlines', 'southwest', 'expedia', 'uber', 'lyft'],
  'transportation': ['shell', 'maverik', 'chevron', 'exxon', 'mobil', 'bp', 'wawa', 'speedway', 'gas', 'fuel'],
  'food': ['kroger', 'safeway', 'publix', 'albertsons', 'walmart', 'mcdonalds', 'starbucks', 'subway', 'wendys', 'taco bell', 'burger king', 'restaurant'],
  'shopping': ['target', 'amazon', 'best buy', 'home depot', 'lowes', 'costco', 'sams club'],
  'entertainment': ['netflix', 'spotify', 'hulu', 'disney+', 'hbo', 'amc', 'regal', 'steam', 'xbox', 'playstation'],
  'utilities': ['pg&e', 'conedison', 'comcast', 'xfinity', 'at&t', 'verizon', 't-mobile', 'water', 'electric', 'power'],
};

function getSuggestedCategory(description: string, categories: ExpenseCategory[]): string | null {
  const descLower = description.toLowerCase();
  
  let matchedTopic = '';
  for (const [topic, keywords] of Object.entries(KEYWORD_RULES)) {
    if (keywords.some(kw => descLower.includes(kw))) {
      matchedTopic = topic;
      break;
    }
  }

  if (!matchedTopic) return null;

  const matchingCat = categories.find(c => {
    const nameLower = c.name.toLowerCase();
    if (matchedTopic === 'transportation' && (nameLower.includes('transport') || nameLower.includes('auto') || nameLower.includes('gas') || nameLower.includes('car'))) return true;
    if (matchedTopic === 'food' && (nameLower.includes('food') || nameLower.includes('grocer') || nameLower.includes('dining') || nameLower.includes('restaurant'))) return true;
    if (matchedTopic === 'travel' && (nameLower.includes('travel') || nameLower.includes('vacation') || nameLower.includes('trip'))) return true;
    if (matchedTopic === 'shopping' && (nameLower.includes('shop') || nameLower.includes('misc') || nameLower.includes('personal'))) return true;
    if (nameLower.includes(matchedTopic)) return true;
    return false;
  });

  return matchingCat ? matchingCat.id : null;
}

export async function parseChaseStatement(file: File, categories: ExpenseCategory[]): Promise<ParsedTransaction[]> {
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
                  suggestedCategoryId: getSuggestedCategory(description, categories)
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
