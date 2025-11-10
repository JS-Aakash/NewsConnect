import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSafeNavigation = () => {
  const navigate = useNavigate();
  const lastNavigationTime = useRef<number>(0);
  const navigationTimeout = useRef<NodeJS.Timeout | null>(null);

  const safeNavigate = useCallback((path: string, options: { replace?: boolean } = {}) => {
    const now = Date.now();
    const timeSinceLastNavigation = now - lastNavigationTime.current;
    
    // Prevent navigation if it's been less than 500ms since the last navigation
    if (timeSinceLastNavigation < 500) {
      return;
    }

    // Clear any pending navigation
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
    }

    // Set a small delay to prevent rapid successive navigations
    navigationTimeout.current = setTimeout(() => {
      lastNavigationTime.current = Date.now();
      navigate(path, options);
    }, 100);
  }, [navigate]);

  const resetNavigationState = useCallback(() => {
    lastNavigationTime.current = 0;
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
      navigationTimeout.current = null;
    }
  }, []);

  return { safeNavigate, resetNavigationState };
};