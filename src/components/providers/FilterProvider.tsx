'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { GlobalFilters, DEFAULT_FILTERS, DateRange } from '@/types/filters.types'

type FilterAction = 
  | { type: 'SET_DRAFT_FIELD'; field: keyof GlobalFilters; payload: any }
  | { type: 'APPLY_FILTERS' }
  | { type: 'RESET_DRAFT' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_ALL_APPLIED'; payload: GlobalFilters };

interface FilterContextType {
  filters: GlobalFilters;
  draftFilters: GlobalFilters;
  dispatch: React.Dispatch<FilterAction>;
  applyFilters: () => void;
  clearFilters: () => void;
  isDirty: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

function calculateDateRange(draft: GlobalFilters): DateRange {
  if (draft.customStartDate && draft.customEndDate) {
    return { start: draft.customStartDate, end: draft.customEndDate, preset: 'Custom' };
  }
  const start = new Date(draft.year, draft.month, 1);
  const end = new Date(draft.year, draft.month + 1, 0);
  return { start, end, preset: 'Month/Year' };
}

function filterReducer(state: { draft: GlobalFilters, applied: GlobalFilters }, action: FilterAction) {
  switch (action.type) {
    case 'SET_DRAFT_FIELD': {
      const newDraft = { ...state.draft, [action.field]: action.payload };
      if (action.field === 'categoryIds') {
        newDraft.subcategoryIds = []; // reset subcategories when categories change
      }
      if (action.field === 'month' || action.field === 'year') {
        newDraft.customStartDate = null;
        newDraft.customEndDate = null;
      }
      newDraft.dateRange = calculateDateRange(newDraft);
      return { ...state, draft: newDraft };
    }
    case 'APPLY_FILTERS': {
      return { ...state, applied: state.draft };
    }
    case 'RESET_DRAFT': {
      return { ...state, draft: state.applied };
    }
    case 'CLEAR_ALL': {
      // Clear keeps month/year as current but resets everything else
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const clearedFilters: GlobalFilters = {
        ...DEFAULT_FILTERS,
        month: currentMonth,
        year: currentYear,
        dateRange: {
          start: new Date(currentYear, currentMonth, 1),
          end: new Date(currentYear, currentMonth + 1, 0),
          preset: 'Month/Year'
        }
      };
      return { draft: clearedFilters, applied: clearedFilters };
    }
    case 'SET_ALL_APPLIED': {
      return { draft: action.payload, applied: action.payload };
    }
    default:
      return state;
  }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, { draft: DEFAULT_FILTERS, applied: DEFAULT_FILTERS });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('global_filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dateRange) {
          parsed.dateRange.start = new Date(parsed.dateRange.start);
          parsed.dateRange.end = new Date(parsed.dateRange.end);
        }
        if (parsed.customStartDate) parsed.customStartDate = new Date(parsed.customStartDate);
        if (parsed.customEndDate) parsed.customEndDate = new Date(parsed.customEndDate);
        
        // Compute date range if missing or out of sync (backward compat)
        if (!parsed.month && parsed.month !== 0) {
            parsed.month = parsed.dateRange?.start?.getMonth() ?? new Date().getMonth();
            parsed.year = parsed.dateRange?.start?.getFullYear() ?? new Date().getFullYear();
        }

        dispatch({ type: 'SET_ALL_APPLIED', payload: parsed });
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('global_filters', JSON.stringify(state.applied));
  }, [state.applied]);

  const applyFilters = useCallback(() => {
    dispatch({ type: 'APPLY_FILTERS' });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const isDirty = JSON.stringify(state.draft) !== JSON.stringify(state.applied);

  return (
    <FilterContext.Provider value={{ 
      filters: state.applied, 
      draftFilters: state.draft, 
      dispatch, 
      applyFilters, 
      clearFilters,
      isDirty
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
