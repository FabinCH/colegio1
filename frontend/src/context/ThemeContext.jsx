

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const prefiereSistemaOscuro = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

function leerTemaInicial() {
  try {
    const guardado = localStorage.getItem('theme');
    if (guardado === 'dark')  return true;
    if (guardado === 'light') return false;
    
    return prefiereSistemaOscuro();
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(leerTemaInicial);
  
  const [esManual, setEsManual] = useState(() => {
    try {
      const g = localStorage.getItem('theme');
      return g === 'dark' || g === 'light';
    } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSistema = (e) => {
      if (!esManual) {
        setIsDark(e.matches);
      }
    };
    mq.addEventListener('change', handleSistema);
    return () => mq.removeEventListener('change', handleSistema);
  }, [esManual]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nuevo = !prev;
      localStorage.setItem('theme', nuevo ? 'dark' : 'light');
      return nuevo;
    });
    setEsManual(true);
  };

  const setTheme = (tema) => {
    const oscuro = tema === 'dark';
    setIsDark(oscuro);
    setEsManual(true);
    localStorage.setItem('theme', tema);
  };

  const resetToSystem = () => {
    localStorage.removeItem('theme');
    setEsManual(false);
    setIsDark(prefiereSistemaOscuro());
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, resetToSystem, esManual }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
