import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Initialize React Query Client with global cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes (prevents spamming backend)
      refetchOnWindowFocus: false, // Don't refetch on tab switching
      retry: 1, // Only retry failed requests once
    },
  },
});

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true; // Essential for sending/receiving cookies

// Attach JWT Bearer token from localStorage on every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('mantessa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On any 401, clear stale session and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mantessa_logged_in');
      localStorage.removeItem('mantessa_token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

