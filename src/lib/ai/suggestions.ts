/**
 * Smart AI Category Suggestions
 * Initial implementation: Keyword-based heuristic.
 * Ready for extension to embeddings/LLM.
 */

interface Suggestion {
  categoryId: string
  subcategoryId?: string
}

const KEYWORD_MAP: Record<string, { category: string; sub: string }> = {
  'uber': { category: 'Transportation', sub: 'Cabs' },
  'lyft': { category: 'Transportation', sub: 'Cabs' },
  'fuel': { category: 'Transportation', sub: 'Fuel' },
  'petrol': { category: 'Transportation', sub: 'Fuel' },
  'mcdonald': { category: 'Food', sub: 'Hotel / Restaurant' },
  'starbucks': { category: 'Food', sub: 'Hotel / Restaurant' },
  'grocery': { category: 'Food', sub: 'Groceries' },
  'vegetable': { category: 'Food', sub: 'Vegetables' },
  'electricity': { category: 'Utilities', sub: 'Electricity' },
  'mobile': { category: 'Utilities', sub: 'Mobile Recharge' },
  'salary': { category: 'Salary', sub: 'Salary' },
  'amazon': { category: 'Gadgets', sub: 'Electronics / Accessories' },
  'flipkart': { category: 'Gadgets', sub: 'Electronics / Accessories' },
  'medicine': { category: 'Health Care', sub: 'Medicines' },
  'insurance': { category: 'Insurance', sub: 'Others Insurance' },
}

export function suggestCategory(description: string, categories: any[]): Suggestion | null {
  if (!description) return null
  
  const desc = description.toLowerCase()
  
  // Find keyword match
  const match = Object.entries(KEYWORD_MAP).find(([key]) => desc.includes(key))
  
  if (match) {
    const [_, target] = match
    const category = categories.find(c => c.name.toLowerCase() === target.category.toLowerCase())
    
    if (category) {
      const subcategory = category.subcategories?.find((s: any) => s.name.toLowerCase() === target.sub.toLowerCase())
      return {
        categoryId: category.id,
        subcategoryId: subcategory?.id
      }
    }
  }
  
  return null
}
