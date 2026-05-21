// src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('operix_theme') || 'light');

  useEffect(() => {
	const root = window.document.documentElement;
	root.classList.remove('light', 'dark');
	root.classList.add(theme);
	localStorage.setItem('operix_theme', theme);
  }, [theme]);

  return (
	<ThemeContext.Provider value={{ theme, setTheme }}>
	  {children}
	</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);