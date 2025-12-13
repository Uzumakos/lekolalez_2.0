import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-brand-blue" />;
    }
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-brand-blue text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAll} 
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`relative p-4 hover:bg-gray-50 transition-colors group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                      
                      <div 
                        className="flex gap-3 cursor-pointer"
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-semibold mb-0.5 ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-medium">
                              {formatTime(notif.timestamp)}
                            </span>
                            {notif.link && (
                              <Link 
                                to={notif.link}
                                className="text-xs text-brand-blue font-medium hover:underline"
                                onClick={() => markAsRead(notif.id)}
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        </div>
                        {!notif.isRead && (
                           <div className="mt-2 w-2 h-2 bg-brand-blue rounded-full shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};