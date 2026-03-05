import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, BarChart3, Receipt, X, Briefcase, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isMobileOpen: boolean;
  closeMobile: () => void;
  isDesktopOpen: boolean;
}

const Sidebar = ({ isMobileOpen, closeMobile, isDesktopOpen }: SidebarProps) => {
  const { currentUser, users, login, isAdmin } = useAuth();

  const navItems = [
    // { to: '/', icon: LayoutDashboard, label: 'Panel', roles: ['admin', 'collaborator'] }, // Removed as requested
    { to: '/invoices', icon: Receipt, label: 'Facturación', roles: ['admin', 'collaborator'] },
    // Contacts removed from sidebar as requested
    { to: '/team', icon: Briefcase, label: 'Usuarios', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:transition-transform lg:duration-300
        ${isDesktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">NexoHub</h1>
          </div>
          {/* Close button for mobile */}
          <button onClick={closeMobile} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => closeMobile()} // Close sidebar on click (mobile)
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Switcher (For Demo Purposes) */}
        <div className="p-4 border-t border-slate-800">
           <div className="group relative">
              <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-slate-800 transition-colors text-left">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentUser.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {currentUser.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role}</p>
                </div>
                <ChevronUp size={16} className="text-slate-500 group-hover:text-white" />
              </button>
              
              {/* Dropdown to switch users */}
              <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
                 <div className="p-2 text-xs text-slate-500 font-bold uppercase tracking-wider">Cambiar Usuario (Demo)</div>
                 {users.map(u => (
                     <button 
                        key={u.id}
                        onClick={() => login(u.id)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-700 ${currentUser.id === u.id ? 'text-white bg-slate-700/50' : 'text-slate-300'}`}
                     >
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: u.role === 'admin' ? '#a855f7' : '#3b82f6'}}></div>
                        {u.name}
                     </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;