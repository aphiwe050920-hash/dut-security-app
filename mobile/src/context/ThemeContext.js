import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const LIGHT_THEME = {
  primary: '#CC0000',
  primaryDark: '#990000',
  secondary: '#1a1a2e',
  accent: '#e94560',
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  white: '#ffffff',
  black: '#000000',
  light: '#f5f5f5',
  grey: '#95a5a6',
  darkGrey: '#2c3e50',
  background: '#f0f2f5',
  card: '#ffffff',
  border: '#e0e0e0',
  text: '#2c3e50',
  subText: '#95a5a6',
  inputBg: '#f5f5f5',
  navBg: '#ffffff',
  statusBar: 'dark',
};

export const DARK_THEME = {
  primary: '#CC0000',
  primaryDark: '#990000',
  secondary: '#0d0d0d',
  accent: '#e94560',
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  white: '#1e1e1e',
  black: '#ffffff',
  light: '#2a2a2a',
  grey: '#888888',
  darkGrey: '#cccccc',
  background: '#121212',
  card: '#1e1e1e',
  border: '#333333',
  text: '#f0f0f0',
  subText: '#888888',
  inputBg: '#2a2a2a',
  navBg: '#1e1e1e',
  statusBar: 'light',
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('darkMode', JSON.stringify(newVal));
  };

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('darkMode');
      if (saved !== null) setIsDark(JSON.parse(saved));
    } catch {}
  };

  React.useEffect(() => { loadTheme(); }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);