// LoaderContext.js
import React, { createContext, useContext, useState } from 'react';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [isLoading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const value = {
    isLoading,
    showLoader,
    hideLoader,
  };

  return (
    <LoaderContext.Provider value={value}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
};
