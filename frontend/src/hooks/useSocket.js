import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to manage socket.io-client connection.
 * Authenticates with the JWT token and listens for real-time notifications.
 */
export default function useSocket() {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Only connect if user is authenticated and token exists
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Connect to the socket server
    const socket = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log(`[Socket.io] Connected to server as User: ${user.name} (${user.id || 'No ID'})`);
      
      if (user.id) {
        socket.emit('join', user.id);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log(`[Socket.io] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error.message);
    });

    // Listen for real-time notifications from backend
    socket.on('notification', (notification) => {
      console.log('[Socket.io] Notification received:', notification);
      // Asynchronously append to avoid cascading render warnings in hooks/effects
      setTimeout(() => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) {
            return prev;
          }
          return [notification, ...prev];
        });
      }, 0);
    });

    // Clean up connection on unmount or when token changes
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('notification');
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [token, user]);

  return {
    getSocket: () => socketRef.current,
    isConnected,
    notifications,
    setNotifications
  };
}
