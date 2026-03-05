import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell, Check, Trash2, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const Layout = ({ children }: React.PropsWithChildren) => {
  // Estado separado para móvil y escritorio
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotification();
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopOpen(!isDesktopOpen);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  const getBgColor = (type: string) => {
      switch(type) {
          case 'warning': return 'bg-amber-50 border-amber-100 text-amber-700';
          case 'error': return 'bg-red-50 border-red-100 text-red-700';
          case 'success': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
          default: return 'bg-slate-50 border-slate-100 text-slate-700';
      }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar 
        isMobileOpen={isMobileOpen} 
        closeMobile={() => setIsMobileOpen(false)} 
        isDesktopOpen={isDesktopOpen}
      />

      {/* Main Content - Ajuste de margen dinámico para escritorio */}
      <div className={`flex-1 flex flex-col h-screen transition-all duration-300 ease-in-out ${isDesktopOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
         {/* Header */}
         <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
                {/* Botón de Menú - Visible ahora en todas las resoluciones para togglear */}
                <button 
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title={isDesktopOpen ? "Ocultar menú" : "Mostrar menú"}
                >
                    <Menu size={24} />
                </button>
                <span className="font-bold text-slate-800 text-lg lg:hidden">NexoHub</span>
                
                {/* Desktop Placeholder / Breadcrumb */}
                <div className="hidden lg:block text-slate-400 text-sm">
                    CRM Inteligente &gt; Panel de Control
                </div>
            </div>

            {/* Right Actions: Notifications */}
            <div className="flex items-center gap-4" ref={notifRef}>
                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`p-2 rounded-full transition-colors relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50">
                            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-semibold text-slate-700 text-sm">Notificaciones {unreadCount > 0 && `(${unreadCount})`}</h3>
                                <div className="flex gap-1">
                                    <button onClick={markAllAsRead} className="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Marcar todo como leído">
                                        <Check size={16} />
                                    </button>
                                    <button onClick={clearNotifications} className="p-1 text-slate-400 hover:text-red-500 rounded" title="Limpiar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                        No hay notificaciones
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => markAsRead(notif.id)}
                                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${notif.read ? 'opacity-60' : 'bg-white'}`}
                                            >
                                                {!notif.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                                )}
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-slate-800 mb-0.5">{notif.title}</p>
                                                        <p className="text-xs text-slate-500 mb-2 leading-relaxed">{notif.message}</p>
                                                        <div className={`text-[10px] inline-block px-2 py-0.5 rounded border ${getBgColor(notif.type)}`}>
                                                            {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* User Avatar Placeholder */}
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    N
                </div>
            </div>
         </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto pb-10">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;