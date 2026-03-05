import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from 'react';
import { SystemUser } from '../types';

interface AuthContextType {
  currentUser: SystemUser;
  users: SystemUser[];
  login: (userId: string) => void;
  addUser: (user: SystemUser) => void;
  deleteUser: (userId: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Datos iniciales simulados
const initialUsers: SystemUser[] = [
  { id: '1', name: 'Administrador', email: 'admin@nexohub.com', role: 'admin', avatar: 'A' },
  { id: '2', name: 'Colaborador Demo', email: 'colab@nexohub.com', role: 'collaborator', avatar: 'C' },
];

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<SystemUser>(initialUsers[0]);

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const addUser = (user: SystemUser) => {
    setUsers([...users, user]);
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, users, login, addUser, deleteUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};