import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Car, Users, Briefcase, Calendar, Laptop, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_USERS } from '@/lib/constants';

// Main dashboard cards matching Absher layout
const dashboardCards = [
  { id: 'my_services', name: 'خدماتي', icon: Laptop, route: '/services' },
  { id: 'vehicles', name: 'المركبات', icon: Car, route: '/services/traffic' },
  { id: 'family', name: 'أفراد الأسرة', icon: Users, route: '/profile' },
  { id: 'workers', name: 'العمالة', icon: Briefcase, route: '/profile' },
  { id: 'appointments', name: 'مواعيد', icon: Calendar, route: '/requests' },
];

// Other services carousel items
const otherServices = [
  { id: 'passports', name: 'الجوازات', isNew: true },
  { id: 'civil', name: 'الأحوال المدنية', isNew: false },
  { id: 'traffic', name: 'المرور', isNew: false },
];

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const nationalId = user?.email?.replace('@sanad.gov.sa', '') || '';
  const userData = DEMO_USERS[nationalId];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header with Logos */}
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Menu Icon (left in RTL) */}
            <button className="p-2">
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-primary"></div>
                <div className="w-6 h-0.5 bg-primary"></div>
                <div className="w-6 h-0.5 bg-primary"></div>
              </div>
            </button>

            {/* Center - Language Switch */}
            <button className="flex flex-col items-center border border-border rounded-xl px-6 py-2">
              <span className="text-primary text-2xl font-bold">عـ</span>
              <span className="text-xs text-muted-foreground">English</span>
            </button>

            {/* Right - Vision 2030 & Kingdom Logo */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[8px] text-muted-foreground leading-tight">رؤيـــة</p>
                <p className="text-primary font-bold text-lg">2030</p>
                <p className="text-[6px] text-muted-foreground">VISION</p>
              </div>
              <div className="w-px h-8 bg-border mx-1"></div>
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 h-6 bg-primary rounded-full"></div>
                  ))}
                </div>
                <p className="text-[6px] text-muted-foreground mt-1">المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 py-4">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="flex items-center bg-card rounded-lg border border-border overflow-hidden">
              <Input
                placeholder="اكتب هنا للبحث"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-right pr-4 h-12"
              />
              <button className="p-3 text-muted-foreground">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Dashboard Cards - 2x3 Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {dashboardCards.map((card, index) => {
              const IconComponent = card.icon;
              // Special positioning for "مواعيد" to be on the right column, 3rd row
              const isAppointments = card.id === 'appointments';
              
              return (
                <Card
                  key={card.id}
                  onClick={() => navigate(card.route)}
                  className={`cursor-pointer hover:shadow-sanad transition-all duration-200 bg-card border-border ${
                    isAppointments ? 'col-start-2' : ''
                  }`}
                >
                  <CardContent className="p-6 flex flex-col items-center">
                    <div className="mb-3 text-primary">
                      <IconComponent className="w-12 h-12 stroke-[1.5]" />
                    </div>
                    <div className="w-full h-px bg-border mb-3"></div>
                    <h3 className="text-base font-semibold text-foreground">{card.name}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Other Services Section */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex-1 h-px bg-border"></div>
              <h2 className="px-4 text-lg font-semibold text-foreground">خدمات أخرى</h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Services Carousel */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button className="shrink-0 w-10 h-10 rounded-full border border-primary text-primary flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {otherServices.map((service) => (
                <Card 
                  key={service.id}
                  onClick={() => navigate(`/services/${service.id === 'civil' ? 'civil_affairs' : service.id}`)}
                  className="shrink-0 w-40 cursor-pointer hover:shadow-sanad transition-all relative bg-card border-border"
                >
                  {service.isNew && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-sm transform rotate-[-15deg]">
                      جديد
                    </div>
                  )}
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                      <div className="w-4 h-4 rounded bg-primary/30"></div>
                    </div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                  </CardContent>
                </Card>
              ))}

              <button className="shrink-0 w-10 h-10 rounded-full border border-primary text-primary flex items-center justify-center rotate-180">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
