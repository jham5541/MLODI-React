import { useState, useCallback } from 'react';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncOperationActions<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
}

export type AsyncOperationHook<T> = AsyncOperationState<T> & AsyncOperationActions<T>;

/**
 * Custom hook for managing async operations with consistent loading/error states
 * Reduces boilerplate in Zustand stores and components
 */
export function useAsyncOperation<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  initialData: T | null = null
): AsyncOperationHook<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

/**
 * Higher-order function to create standardized async actions for Zustand stores
 */
export function createAsyncAction<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: {
    onSuccess?: (data: T, ...args: Args) => void;
    onError?: (error: any, ...args: Args) => void;
    transform?: (data: T, ...args: Args) => T;
  } = {}
) {
  return (
    set: (fn: (state: any) => any) => void,
    get: () => any,
    loadingKey: string,
    dataKey: string,
    errorKey?: string
  ) => {
    return async (...args: Args): Promise<void> => {
      // Set loading state
      set((state: any) => ({
        ...state,
        [loadingKey]: true,
        ...(errorKey ? { [errorKey]: null } : {})
      }));

      try {
        const result = await asyncFunction(...args);
        const transformedResult = options.transform ? options.transform(result, ...args) : result;
        
        // Set success state
        set((state: any) => ({
          ...state,
          [dataKey]: transformedResult,
          [loadingKey]: false,
        }));

        // Call success callback
        options.onSuccess?.(transformedResult, ...args);
        
      } catch (error: any) {
        // Set error state
        set((state: any) => ({
          ...state,
          [loadingKey]: false,
          ...(errorKey ? { [errorKey]: error?.message || 'An error occurred' } : {})
        }));

        // Call error callback
        options.onError?.(error, ...args);
        
        // Re-throw for caller handling
        throw error;
      }
    };
  };
}

/**
 * Utility to create multiple async actions with consistent patterns
 */
export function createAsyncActions<T extends Record<string, any>>(
  actions: T,
  defaultOptions: {
    onSuccess?: (actionName: string, data: any, ...args: any[]) => void;
    onError?: (actionName: string, error: any, ...args: any[]) => void;
  } = {}
) {
  const createdActions: Record<string, any> = {};
  
  Object.entries(actions).forEach(([actionName, config]) => {
    const { asyncFunction, dataKey, loadingKey, errorKey, ...actionOptions } = config;
    
    createdActions[actionName] = createAsyncAction(
      asyncFunction,
      {
        ...actionOptions,
        onSuccess: (data: any, ...args: any[]) => {
          actionOptions.onSuccess?.(data, ...args);
          defaultOptions.onSuccess?.(actionName, data, ...args);
        },
        onError: (error: any, ...args: any[]) => {
          actionOptions.onError?.(error, ...args);
          defaultOptions.onError?.(actionName, error, ...args);
        },
      }
    );
  });
  
  return createdActions;
}

/**
 * Utility for batching multiple async operations
 */
export function useBatchAsyncOperations() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const executeBatch = useCallback(async (operations: (() => Promise<any>)[]): Promise<any[]> => {
    setLoading(true);
    setErrors([]);
    
    const results: any[] = [];
    const batchErrors: string[] = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error: any) {
        batchErrors.push(error?.message || 'Operation failed');
        results.push(null);
      }
    }
    
    setErrors(batchErrors);
    setLoading(false);
    
    return results;
  }, []);

  const executeAllSettled = useCallback(async (operations: (() => Promise<any>)[]): Promise<PromiseSettledResult<any>[]> => {
    setLoading(true);
    setErrors([]);
    
    const promises = operations.map(op => op());
    const results = await Promise.allSettled(promises);
    
    const batchErrors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason?.message || 'Operation failed');
    
    setErrors(batchErrors);
    setLoading(false);
    
    return results;
  }, []);

  return {
    loading,
    errors,
    executeBatch,
    executeAllSettled,
  };
}
