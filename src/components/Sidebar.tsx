import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Grid3X3, ClipboardList, Bot, User, LogOut, FileText, Car, Users, Plane } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_USERS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/services', label: 'الخدمات', icon: Grid3X3 },
  { path: '/services/traffic', label: 'المرور', icon: Car },
  { path: '/services/passports', label: 'الجوازات', icon: Plane },
  { path: '/services/civil_affairs', label: 'الأحوال المدنية', icon: FileText },
  { path: '/requests', label: 'طلباتي', icon: ClipboardList },
  { path: '/agents', label: 'الوكلاء', icon: Bot },
  { path: '/profile', label: 'الملف الشخصي', icon: User },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const nationalId = user?.email?.replace('@sanad.gov.sa', '') || '';
  const userData = DEMO_USERS[nationalId];

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-72 bg-card z-50 shadow-2xl",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="gradient-primary p-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-right">
            <h2 className="text-primary-foreground font-bold text-lg">القائمة</h2>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="text-right flex-1">
              <p className="font-semibold text-foreground">
                {userData?.fullName || 'مستخدم'}
              </p>
              <p className="text-sm text-muted-foreground">
                {nationalId || 'رقم الهوية'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 flex-row-reverse p-3 rounded-xl mb-1 transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-right font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 flex-row-reverse w-full p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-right font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
}