import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing state (e.g. search input).
 * Delays updating the debounced value until after the specified delay.
 * 
 * @param {*} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 350ms)
 * @returns {*} debouncedValue
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
