import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// 1. TanStack Query Setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// 2. Socket.IO Context Setup
const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

// 3. Theme Context Setup
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('transitops-theme') as Theme) || 'dark';
  });

  // Socket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const { accessToken, activeRole } = useAuthStore();

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('transitops-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Socket Connection setup
  useEffect(() => {
    // Connect to local TransitOps server via Vite proxy
    const socketUrl = '/';
    
    const socketInstance = io(socketUrl, {
      auth: {
        token: accessToken,
      },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Successfully connected to TransitOps Socket.IO server ID:', socketInstance.id);
      
      // Let server know about the active role if authenticated
      if (activeRole) {
        socketInstance.emit('join-role-room', { role: activeRole });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, activeRole]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <SocketContext.Provider value={socket}>
          {children}
        </SocketContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
};
