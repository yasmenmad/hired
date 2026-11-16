import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const { i18n } = useTranslation();
  const [moroccoMode, setMoroccoMode] = useState(() => {
    return localStorage.getItem('moroccoMode') === 'true';
  });

  const language = i18n.language || 'en';

  // Persist and apply Morocco Mode globally
  useEffect(() => {
    localStorage.setItem('moroccoMode', moroccoMode);
    if (moroccoMode) {
      document.body.classList.add('morocco-mode-active');
    } else {
      document.body.classList.remove('morocco-mode-active');
    }
  }, [moroccoMode]);

  // Apply RTL direction
  useEffect(() => {
    if (i18n.language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [i18n.language]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const toggleMoroccoMode = () => setMoroccoMode(prev => !prev);

  return (
    <SettingsContext.Provider value={{ moroccoMode, toggleMoroccoMode, language, changeLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
