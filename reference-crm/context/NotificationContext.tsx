import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const { currentUser } = useAuth();
  // Almacena todas las notificaciones de todos los usuarios
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  // Filtra las notificaciones para mostrar solo las del usuario actual
  const notifications = allNotifications.filter(n => n.userId === currentUser.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      userId: currentUser.id, // Asocia la notificación al usuario actual
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setAllNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    // Solo marca como leídas las del usuario actual
    setAllNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    // Solo elimina las notificaciones del usuario actual
    setAllNotifications(prev => prev.filter(n => n.userId !== currentUser.id));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
};