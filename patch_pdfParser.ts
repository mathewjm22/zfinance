import * as fs from 'fs';

let content = fs.readFileSync('src/utils/pdfParser.ts', 'utf8');

// Replace KEYWORD_RULES
const searchKeywords = `// Simple rule-based categorizer for auto-mapping
const KEYWORD_RULES: Record<string, string[]> = {
  'travel': ['hotel', 'airbnb', 'delta', 'united', 'american airlines', 'southwest', 'expedia', 'uber', 'lyft'],
  'transportation': ['shell', 'maverik', 'chevron', 'exxon', 'mobil', 'bp', 'wawa', 'speedway', 'gas', 'fuel'],
  'food': ['kroger', 'safeway', 'publix', 'albertsons', 'walmart', 'mcdonalds', 'starbucks', 'subway', 'wendys', 'taco bell', 'burger king', 'restaurant'],
  'shopping': ['target', 'amazon', 'best buy', 'home depot', 'lowes', 'costco', 'sams club'],
  'entertainment': ['netflix', 'spotify', 'hulu', 'disney+', 'hbo', 'amc', 'regal', 'steam', 'xbox', 'playstation'],
  'utilities': ['pg&e', 'conedison', 'comcast', 'xfinity', 'at&t', 'verizon', 't-mobile', 'water', 'electric', 'power'],
};`;

const replaceKeywords = `// Simple rule-based categorizer for auto-mapping
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
};`;

content = content.replace(searchKeywords, replaceKeywords);

const searchGetSuggested = `function getSuggestedCategory(description: string, categories: ExpenseCategory[]): string | null {
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
}`;

const replaceGetSuggested = `export function getSuggestedCategoryName(description: string): string | null {
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
}`;

content = content.replace(searchGetSuggested, replaceGetSuggested);

const searchInterface = `export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  suggestedCategoryId: string | null;
}`;

const replaceInterface = `export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
}`;

content = content.replace(searchInterface, replaceInterface);

const searchPush = `transactions.push({
                  id: uid(),
                  date: \`\${year}-\${mm}-\${dd}\`,
                  description: description.trim(),
                  amount: amount,
                  suggestedCategoryId: getSuggestedCategory(description, categories)
                });`;

const replacePush = `transactions.push({
                  id: uid(),
                  date: \`\${year}-\${mm}-\${dd}\`,
                  description: description.trim(),
                  amount: amount,
                  suggestedCategoryId: getSuggestedCategory(description, categories),
                  suggestedCategoryName: getSuggestedCategoryName(description)
                });`;

content = content.replace(searchPush, replacePush);

const newTextParsers = `

export function parseYearlySummaryText(text: string, year: string, categories: ExpenseCategory[]): ParsedTransaction[] {
  const lines = text.split('\\n').map(l => l.trim()).filter(l => l);
  const transactions: ParsedTransaction[] = [];

  // Try format 1: "HomeShow details\\n$31,932.20\\t46%"
  // We can look for "$XX,XXX.XX" format.

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if it's the summarized format
    if (line.includes('Show details')) {
      const categoryName = line.replace('Show details', '').trim();
      if (i + 1 < lines.length) {
        const nextLine = lines[i+1];
        const match = nextLine.match(/\\$([\\d,]+\\.\\d{2})/);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          transactions.push({
            id: uid(),
            date: \`\${year}-12-31\`,
            description: \`\${year} Summary - \${categoryName}\`,
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
    const rawMatch = line.match(/^([A-Z][a-z]{2} \\d{1,2}, \\d{4})\\s+(.+)\\s+\\$([\\d,]+\\.\\d{2})$/);
    if (rawMatch) {
      const dateStr = rawMatch[1];
      const descAndCat = rawMatch[2]; // Contains description, account, category
      const amount = parseFloat(rawMatch[3].replace(/,/g, ''));

      const d = new Date(dateStr);
      const formattedDate = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;

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
`;

content += newTextParsers;

fs.writeFileSync('src/utils/pdfParser.ts', content, 'utf8');
