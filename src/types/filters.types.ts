export type TransactionType = 'all' | 'income' | 'expense';

export type SortOption = 
  | 'Newest First' 
  | 'Oldest First' 
  | 'Highest Amount' 
  | 'Lowest Amount' 
  | 'A-Z' 
  | 'Z-A';

export interface DateRange {
  start: Date;
  end: Date;
  preset?: string;
}

export interface AmountRange {
  min: number | null;
  max: number | null;
}

export interface GlobalFilters {
  dateRange: DateRange; // Derived property used for queries
  month: number; // 0-11
  year: number;
  customStartDate: Date | null;
  customEndDate: Date | null;
  transactionType: TransactionType;
  categoryIds: string[];
  subcategoryIds: string[];
  userIds: string[];
  amountRange: AmountRange;
  searchQuery: string;
  sortBy: SortOption;
}

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

export const DEFAULT_FILTERS: GlobalFilters = {
  dateRange: {
    start: new Date(currentYear, currentMonth, 1),
    end: new Date(currentYear, currentMonth + 1, 0),
    preset: 'This Month'
  },
  month: currentMonth,
  year: currentYear,
  customStartDate: null,
  customEndDate: null,
  transactionType: 'all',
  categoryIds: [],
  subcategoryIds: [],
  userIds: [],
  amountRange: { min: null, max: null },
  searchQuery: '',
  sortBy: 'Newest First'
};
