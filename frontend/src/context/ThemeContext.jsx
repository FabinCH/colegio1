// ============================================
// context/ThemeContext.jsx — Modo oscuro / claro
// ============================================
//
// COMPORTAMIENTO:
//   1. Si el usuario YA eligió un tema (guardado en localStorage) → usa ese.
//   2. Si el usuario NUNCA eligió → sigue la preferencia del sistema operativo
//      (prefers-color-scheme: dark / light).
//   3. Si el sistema cambia mientras la app está abierta → se actualiza automáticamente
//      (solo cuando el usuario no tiene preferencia manual guardada).
//   4. Al presionar el botón de tema → se guarda la elección manual y ya no sigue al sistema.

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// Detecta si el sistema prefiere modo oscuro
const prefiereSistemaOscuro = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Leer el tema inicial:
//   - Si hay elección manual en localStorage → usarla
//   - Si no → seguir al sistema operativo
function leerTemaInicial() {
  try {
    const guardado = localStorage.getItem('theme');
    if (guardado === 'dark')  return true;
    if (guardado === 'light') return false;
    // Sin elección manual → seguir al sistema
    return prefiereSistemaOscuro();
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(leerTemaInicial);
  // Rastrear si el usuario eligió manualmente (para no sobreescribir con el sistema)
  const [esManual, setEsManual] = useState(() => {
    try {
      const g = localStorage.getItem('theme');
      return g === 'dark' || g === 'light';
    } catch { return false; }
  });

  // Aplicar el tema al <html> cada vez que cambie
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

  // Escuchar cambios del sistema operativo en tiempo real
  // Solo aplica si el usuario NO eligió manualmente
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

  // El usuario presiona el botón → guardar elección manual
  const toggleTheme = () => {
    setIsDark((prev) => {
      const nuevo = !prev;
      localStorage.setItem('theme', nuevo ? 'dark' : 'light');
      return nuevo;
    });
    setEsManual(true);
  };

  // Forzar un tema específico desde fuera
  const setTheme = (tema) => {
    const oscuro = tema === 'dark';
    setIsDark(oscuro);
    setEsManual(true);
    localStorage.setItem('theme', tema);
  };

  // Resetear al sistema (quita la elección manual)
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
