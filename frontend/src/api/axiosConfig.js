// ============================================
// api/axiosConfig.js — Configuración de Axios
// ============================================
//
// ¿QUÉ ES AXIOS?
// Axios es una librería para hacer peticiones HTTP desde el frontend.
// Es parecido a fetch(), pero más fácil de usar y con más funciones.
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Crea una "instancia" de Axios preconfigurada con la URL del backend.
// Así en vez de escribir "http://localhost:5000/api/auth/login" cada vez,
// solo escribimos "/auth/login" y Axios completa el resto.
//
// También agrega automáticamente el token JWT a cada petición
// (eso lo veremos en la Iteración 2, pero el código ya queda preparado).

import axios from 'axios';

// Usamos '/api' relativo para que el proxy de Vite en vite.config.js lo redirija al backend.
// Esto permite que funcione tanto desde la PC como desde cualquier celular en la red WiFi.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// INTERCEPTOR: Se ejecuta ANTES de cada petición
// Si hay un token guardado en localStorage, lo agrega al header "Authorization"
// Esto es para que las rutas protegidas del backend sepan quién eres
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
