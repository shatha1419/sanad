import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

// Custom SVG Icons matching Absher style
const LaptopIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="10" width="32" height="22" rx="2" />
    <path d="M4 32h40" />
    <path d="M16 35h16" />
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 28v6a2 2 0 002 2h4v-4h20v4h4a2 2 0 002-2v-6" />
    <path d="M10 28l4-10h20l4 10" />
    <circle cx="14" cy="30" r="2" />
    <circle cx="34" cy="30" r="2" />
    <path d="M14 18l2-4h16l2 4" />
  </svg>
);

const FamilyIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="24" cy="14" r="5" />
    <circle cx="12" cy="18" r="4" />
    <circle cx="36" cy="18" r="4" />
    <path d="M24 22c-6 0-10 4-10 8v4h20v-4c0-4-4-8-10-8z" />
    <path d="M12 24c-4 0-6 3-6 6v4h8" />
    <path d="M36 24c4 0 6 3 6 6v4h-8" />
  </svg>
);

const WorkersIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="16" cy="16" r="4" />
    <circle cx="32" cy="16" r="4" />
    <path d="M16 8l-3-3h6l-3 3" />
    <path d="M32 8l-3-3h6l-3 3" />
    <rect x="12" y="6" width="8" height="3" rx="1" />
    <rect x="28" y="6" width="8" height="3" rx="1" />
    <path d="M16 22c-5 0-8 3-8 6v8h16v-8c0-3-3-6-8-6z" />
    <path d="M32 22c-5 0-8 3-8 6v8h16v-8c0-3-3-6-8-6z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="12" width="32" height="28" rx="2" />
    <path d="M8 20h32" />
    <path d="M16 8v8" />
    <path d="M32 8v8" />
    <path d="M14 26h4v4h-4z" />
    <path d="M22 26h4v4h-4z" />
    <path d="M30 26h4v4h-4z" />
    <path d="M14 32h4v4h-4z" />
    <path d="M22 32h4v4h-4z" />
  </svg>
);

// Dashboard cards data
const dashboardCards = [
  { id: 'my_services', name: 'خدماتي', icon: LaptopIcon, route: '/services' },
  { id: 'vehicles', name: 'المركبات', icon: CarIcon, route: '/services/traffic' },
  { id: 'family', name: 'أفراد الأسرة', icon: FamilyIcon, route: '/profile' },
  { id: 'workers', name: 'العمالة', icon: WorkersIcon, route: '/profile' },
];

const appointmentCard = { id: 'appointments', name: 'مواعيد', icon: CalendarIcon, route: '/requests' };

// Other services
const otherServices = [
  { id: 'passports', name: 'الجوازات', isNew: true },
  { id: 'civil', name: 'الأحوال المدنية', isNew: false },
  { id: 'traffic', name: 'المرور', isNew: false },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Menu Icon */}
            <button className="p-2">
              <div className="space-y-1">
                <div className="w-6 h-0.5 bg-primary rounded"></div>
                <div className="w-6 h-0.5 bg-primary rounded"></div>
                <div className="w-6 h-0.5 bg-primary rounded"></div>
              </div>
            </button>

            {/* Language Switch */}
            <button className="flex flex-col items-center border-2 border-primary/30 rounded-2xl px-8 py-3 bg-card">
              <span className="text-primary text-3xl font-arabic leading-none">عـ</span>
              <span className="text-xs text-muted-foreground mt-1">English</span>
            </button>

            {/* Vision 2030 & Kingdom Logo */}
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-[10px] text-muted-foreground">رؤيـــة VISION</p>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-bold text-xl">2030</span>
                  <div className="w-5 h-5 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full border-2 border-primary"></div>
                    </div>
                  </div>
                </div>
                <p className="text-[8px] text-muted-foreground">KINGDOM OF SAUDI ARABIA</p>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="flex flex-col items-center">
                <div className="flex gap-[3px]">
                  <div className="w-[3px] h-6 bg-primary rounded-full"></div>
                  <div className="w-[3px] h-6 bg-primary rounded-full"></div>
                  <div className="w-[3px] h-6 bg-primary rounded-full"></div>
                  <div className="w-[3px] h-6 bg-primary rounded-full"></div>
                </div>
                <p className="text-[8px] text-muted-foreground mt-0.5">المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 py-4 bg-background">
          {/* Search Bar */}
          <div className="relative mb-5">
            <div className="flex items-center bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <Input
                placeholder="اكتب هنا للبحث"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-right pr-4 h-12 text-base"
              />
              <button className="p-3 text-muted-foreground">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Cards - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {dashboardCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Card
                  key={card.id}
                  onClick={() => navigate(card.route)}
                  className="cursor-pointer hover:shadow-sanad transition-all duration-200 bg-card border-border"
                >
                  <CardContent className="p-5 flex flex-col items-center">
                    <div className="text-primary mb-3">
                      <IconComponent />
                    </div>
                    <div className="w-full h-px bg-border mb-3"></div>
                    <h3 className="text-base font-semibold text-foreground">{card.name}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Appointments Card - Right aligned */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div></div>
            <Card
              onClick={() => navigate(appointmentCard.route)}
              className="cursor-pointer hover:shadow-sanad transition-all duration-200 bg-card border-border"
            >
              <CardContent className="p-5 flex flex-col items-center">
                <div className="text-primary mb-3">
                  <CalendarIcon />
                </div>
                <div className="w-full h-px bg-border mb-3"></div>
                <h3 className="text-base font-semibold text-foreground">{appointmentCard.name}</h3>
              </CardContent>
            </Card>
          </div>

          {/* Other Services Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-5">
              <div className="flex-1 h-px bg-border"></div>
              <h2 className="px-4 text-lg font-semibold text-foreground">خدمات أخرى</h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Services Carousel */}
            <div className="flex items-center gap-3">
              <button className="shrink-0 w-10 h-10 rounded-full border-2 border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-3">
                  {otherServices.map((service) => (
                    <Card 
                      key={service.id}
                      onClick={() => navigate(`/services/${service.id === 'civil' ? 'civil_affairs' : service.id}`)}
                      className="shrink-0 w-36 cursor-pointer hover:shadow-sanad transition-all relative bg-card border-border"
                    >
                      {service.isNew && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 font-bold transform -rotate-12 shadow-sm">
                            جديد
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                            <div className="w-3 h-3 rounded bg-primary/40"></div>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground">{service.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <button className="shrink-0 w-10 h-10 rounded-full border-2 border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
