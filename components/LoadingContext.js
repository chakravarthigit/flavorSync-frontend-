import React, { createContext, useState, useContext, useRef } from 'react';
import { ThemeContext } from '../App';

// Create loading context with simplified API
const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: () => {},
  loadingMessage: '',
  setLoadingMessage: () => {},
  showLoader: () => {},
  hideLoader: () => {},
});

// Hook to use the loading context
export const useLoading = () => useContext(LoadingContext);

// Loading provider component - simplified version without actual loader
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const timerRef = useRef(null);

  // Simplified showLoader that just manages state
  const showLoader = (message = '') => {
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set state but don't show anything
    setLoadingMessage(message);
    setIsLoading(true);
    
    // Auto-hide after minimal delay
    timerRef.current = setTimeout(() => {
      hideLoader();
    }, 10);
  };

  // Simplified hideLoader
  const hideLoader = () => {
    // Clear any timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset state
    setIsLoading(false);
    setLoadingMessage('');
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
        showLoader,
        hideLoader,
      }}
    >
      {children}
      {/* No Modal or Loader component */}
    </LoadingContext.Provider>
  );
};

export default LoadingProvider; 