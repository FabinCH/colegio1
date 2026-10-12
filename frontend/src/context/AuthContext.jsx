

import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};

function leerUsuarioLocal() {
  try {
    const s = localStorage.getItem('usuario');
    const usr = s ? JSON.parse(s) : null;
    if (!usr) return null;
    
    if (!usr.rol) {
      try {
        const tk = localStorage.getItem('token');
        if (tk) {
          const payload = JSON.parse(atob(tk.split('.')[1]));
          if (payload.rol) usr.rol = payload.rol;
        }
      } catch {  }
    }
    return usr;
  } catch { return null; }
}

function leerTokenLocal() {
  return localStorage.getItem('token') || null;
}

export const AuthProvider = ({ children }) => {
  const tokenInicial   = leerTokenLocal();
  const usuarioInicial = leerUsuarioLocal();

  const [usuario, setUsuario] = useState(usuarioInicial);
  const [token, setToken]     = useState(tokenInicial);

  const [cargando, setCargando] = useState(
    !!tokenInicial && !usuarioInicial
  );

  useEffect(() => {
    const verificar = async () => {
      const tk = leerTokenLocal();
      if (!tk) {
        setCargando(false);
        return;
      }

      if (!navigator.onLine) {
        const usr = leerUsuarioLocal();
        if (usr) {
          setUsuario(usr);
          setToken(tk);
        } else {

          try {
            const payload = JSON.parse(atob(tk.split('.')[1]));

            const usuarioFromJWT = {
              _id:    payload.id,   
              id:     payload.id,
              nombre: 'Usuario',   
              email:  '',
              rol:    payload.rol || 'docente',
            };
            setUsuario(usuarioFromJWT);
            setToken(tk);
            localStorage.setItem('usuario', JSON.stringify(usuarioFromJWT));
          } catch {
            
          }
        }
        setCargando(false);
        return;
      }

      try {
        const { data } = await API.get('/auth/perfil');
        
        const perfil = data.data.usuario;
        const usr = { ...perfil, _id: perfil.id || perfil._id };
        setUsuario(usr);
        setToken(tk);
        localStorage.setItem('usuario', JSON.stringify(usr));
      } catch (error) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setToken(null);
          setUsuario(null);
        } else {
          
          const usr = leerUsuarioLocal();
          if (usr) setUsuario(usr);
        }
      } finally {
        setCargando(false);
      }
    };

    if (cargando) {
      verificar();
    } else if (navigator.onLine && token) {
      
      verificar();
    }
  
  }, []);

  useEffect(() => {
    const onOnline = async () => {
      const tk = leerTokenLocal();
      if (!tk) return;
      try {
        const { data } = await API.get('/auth/perfil');
        const perfil = data.data.usuario;
        const usr = { ...perfil, _id: perfil.id || perfil._id };
        setUsuario(usr);
        localStorage.setItem('usuario', JSON.stringify(usr));
      } catch {  }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const login = async (email, password) => {
    if (!navigator.onLine) {
      return {
        exito: false,
        mensaje: 'Sin conexión. No se puede iniciar sesión por primera vez sin internet.',
      };
    }
    const { data } = await API.post('/auth/login', { email, password });
    if (data.exito) {
      const perfil = data.data.usuario;
      const usr    = { ...perfil, _id: perfil.id || perfil._id };
      const tk     = data.data.token;
      localStorage.setItem('token',   tk);
      localStorage.setItem('usuario', JSON.stringify(usr));
      setToken(tk);
      setUsuario(usr);
    }
    return data;
  };

  const register = async (nombre, email, password, rol) => {
    const { data } = await API.post('/auth/register', { nombre, email, password, rol });
    if (data.exito) {
      const usr = data.data.usuario;
      const tk  = data.data.token;
      localStorage.setItem('token',   tk);
      localStorage.setItem('usuario', JSON.stringify(usr));
      setToken(tk);
      setUsuario(usr);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  const value = {
    usuario,
    token,
    cargando,
    login,
    register,
    logout,
    estaAutenticado: !!token && !!usuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
