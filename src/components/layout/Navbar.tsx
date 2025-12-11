import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ClipboardList, User, LogOut, Menu, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_USERS } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/services', label: 'الخدمات', icon: Grid3X3 },
  { path: '/requests', label: 'طلباتي', icon: ClipboardList },
  { path: '/agents', label: 'الوكلاء', icon: Bot },
];

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Get user data
  const nationalId = user?.email?.replace('@sanad.gov.sa', '') || '';
  const userData = DEMO_USERS[nationalId];

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Menu Button - Mobile */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-sanad">
              <span className="text-primary-foreground font-bold text-xl">س</span>
            </div>
            <span className="font-bold text-xl text-foreground hidden md:block">سَنَد</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/services' && location.pathname.startsWith('/services'));
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`gap-2 ${isActive ? 'gradient-primary text-primary-foreground' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Info & Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">أهلاً،</p>
              <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                {userData?.fullName?.split(' ').slice(0, 2).join(' ') || 'مستخدم'}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <div className="px-2 py-1.5 text-sm text-muted-foreground text-right">
                  {userData?.fullName || 'مستخدم'}
                </div>
                <DropdownMenuSeparator />
                <Link to="/profile">
                  <DropdownMenuItem className="cursor-pointer flex-row-reverse">
                    <User className="w-4 h-4 mr-2" />
                    الملف الشخصي
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer flex-row-reverse">
                  <LogOut className="w-4 h-4 mr-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 right-0 left-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/services' && location.pathname.startsWith('/services'));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              location.pathname === '/profile'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">حسابي</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
