import { useState, useCallback, useRef, useEffect } from 'react';
import { searchNotes, type SearchResult, type SearchOptions } from '../services/notes/NotesSearchService';

export interface UseNotesSearchOptions extends SearchOptions {
  debounceMs?: number;
  maxResults?: number;
  enabled?: boolean;
}

export interface UseNotesSearchReturn {
  search: (keyword: string) => void;
  cancel: () => void;
  reset: () => void;
  keyword: string;
  setKeyword: (keyword: string) => void;
  isSearching: boolean;
  results: SearchResult[];
  stats: {
    total: number;
    fileNameMatches: number;
    contentMatches: number;
    bothMatches: number;
  };
  error: Error | null;
}

/**
 * 笔记全文搜索 Hook
 */
export function useNotesSearch(options: UseNotesSearchOptions = {}): UseNotesSearchReturn {
  const { 
    debounceMs = 300, 
    maxResults = 100, 
    enabled = true, 
    ...searchOptions 
  } = options;

  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    fileNameMatches: 0,
    contentMatches: 0,
    bothMatches: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchOptionsRef = useRef(searchOptions);
  const maxResultsRef = useRef(maxResults);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    searchOptionsRef.current = searchOptions;
    maxResultsRef.current = maxResults;
    enabledRef.current = enabled;
  }, [searchOptions, maxResults, enabled]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsSearching(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setKeyword('');
    setResults([]);
    setStats({ total: 0, fileNameMatches: 0, contentMatches: 0, bothMatches: 0 });
    setError(null);
  }, [cancel]);

  const performSearch = useCallback(async (searchKeyword: string) => {
    if (!enabledRef.current) {
      return;
    }

    cancel();

    if (!searchKeyword.trim()) {
      setResults([]);
      setStats({ total: 0, fileNameMatches: 0, contentMatches: 0, bothMatches: 0 });
      return;
    }

    setIsSearching(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const searchResults = await searchNotes(
        searchKeyword.trim(),
        searchOptionsRef.current,
        abortController.signal
      );

      if (abortController.signal.aborted) {
        return;
      }

      const limitedResults = searchResults.slice(0, maxResultsRef.current);

      const newStats = {
        total: limitedResults.length,
        fileNameMatches: limitedResults.filter(r => r.matchType === 'filename').length,
        contentMatches: limitedResults.filter(r => r.matchType === 'content').length,
        bothMatches: limitedResults.filter(r => r.matchType === 'both').length
      };

      setResults(limitedResults);
      setStats(newStats);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [cancel]);

  const search = useCallback((searchKeyword: string) => {
    setKeyword(searchKeyword);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchKeyword);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    search,
    cancel,
    reset,
    keyword,
    setKeyword,
    isSearching,
    results,
    stats,
    error
  };
}
