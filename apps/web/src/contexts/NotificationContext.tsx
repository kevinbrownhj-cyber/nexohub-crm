import React, { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationContextType {
  addNotification: (title: string, message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const addNotification = (title: string, message: string, type: NotificationType) => {
    const content = (
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm">{message}</div>
      </div>
    );

    switch (type) {
      case 'success':
        toast.success(content, { duration: 4000 });
        break;
      case 'error':
        toast.error(content, { duration: 5000 });
        break;
      case 'warning':
        toast(content, { 
          icon: '⚠️',
          duration: 4500,
          style: {
            background: '#fef3c7',
            color: '#92400e',
          }
        });
        break;
      case 'info':
        toast(content, { 
          icon: 'ℹ️',
          duration: 4000,
          style: {
            background: '#dbeafe',
            color: '#1e40af',
          }
        });
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
