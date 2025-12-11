import { useState } from 'react';
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

// Icons for other services
const CertificateIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="6" width="32" height="36" rx="2" />
    <path d="M14 14h20" />
    <path d="M14 20h20" />
    <path d="M14 26h12" />
    <circle cx="32" cy="32" r="6" />
    <path d="M32 29v3l2 2" />
  </svg>
);

const ReportsIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="6" y="8" width="36" height="32" rx="2" />
    <path d="M14 16h20" />
    <path d="M14 22h16" />
    <path d="M14 28h12" />
    <path d="M14 34h8" />
    <rect x="30" y="26" width="8" height="10" rx="1" />
  </svg>
);

const VehicleSaleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 28v6a2 2 0 002 2h4v-4h20v4h4a2 2 0 002-2v-6" />
    <path d="M10 28l4-10h20l4 10" />
    <circle cx="14" cy="30" r="2" />
    <circle cx="34" cy="30" r="2" />
    <path d="M22 12h4l2 6h-8l2-6z" />
    <path d="M20 8h8" />
  </svg>
);

const AuctionIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="10" y="28" width="28" height="12" rx="2" />
    <path d="M16 32h4" />
    <path d="M16 36h8" />
    <path d="M28 32h6" />
    <path d="M28 36h4" />
    <path d="M18 20l6-12 6 12" />
    <circle cx="24" cy="22" r="3" />
  </svg>
);

const TravelBanIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 38l24-28" strokeWidth="2" />
    <path d="M34 14l4-4-8-2 2 8 4-4z" />
    <circle cx="24" cy="24" r="16" />
    <circle cx="18" cy="28" r="3" />
    <path d="M8 40l4-4" />
  </svg>
);

const ViolationsIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="12" width="32" height="28" rx="2" />
    <path d="M8 20h32" />
    <circle cx="16" cy="30" r="4" />
    <circle cx="32" cy="30" r="4" />
    <path d="M20 30h8" />
    <path d="M24 6v6" />
    <path d="M20 8h8" />
  </svg>
);

const PaymentBalanceIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="6" y="14" width="36" height="24" rx="3" />
    <path d="M6 22h36" />
    <path d="M12 30h8" />
    <path d="M12 34h4" />
    <circle cx="34" cy="32" r="4" />
    <path d="M34 30v4" />
    <path d="M32 32h4" />
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

// Other services with all items
const otherServices = [
  { id: 'criminal_record', name: 'إصدار شهادة خلو سوابق', icon: CertificateIcon, route: '/services/civil_affairs' },
  { id: 'absher_reports', name: 'تقارير أبشر', icon: ReportsIcon, route: '/services' },
  { id: 'vehicle_sale', name: 'مبايعة المركبات', icon: VehicleSaleIcon, route: '/services/traffic' },
  { id: 'plate_auction', name: 'مزاد اللوحات الإلكترونية', icon: AuctionIcon, route: '/services/traffic' },
  { id: 'travel_ban', name: 'إيقاف الخدمات وقيود السفر', icon: TravelBanIcon, route: '/services' },
  { id: 'violations_inquiry', name: 'الاستعلام الشامل عن المخالفات المرورية', icon: ViolationsIcon, route: '/services/traffic' },
  { id: 'payment_balance', name: 'رصيد المدفوعات الحكومية', icon: PaymentBalanceIcon, route: '/services' },
];

export default function Index() {
  const navigate = useNavigate();
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  const nextService = () => {
    setCurrentServiceIndex((prev) => (prev + 1) % otherServices.length);
  };

  const prevService = () => {
    setCurrentServiceIndex((prev) => (prev - 1 + otherServices.length) % otherServices.length);
  };

  const currentService = otherServices[currentServiceIndex];
  const CurrentIcon = currentService.icon;

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
          <div className="mb-6 bg-muted py-8 -mx-4 px-4">
            <div className="flex items-center justify-center mb-6">
              <div className="flex-1 h-px bg-border"></div>
              <h2 className="px-4 text-lg font-semibold text-foreground">خدمات أخرى</h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Services Carousel - Single Card View */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={nextService}
                className="shrink-0 text-primary hover:text-primary/70 transition-colors"
              >
                <ChevronLeft className="w-10 h-10" strokeWidth={2.5} />
              </button>
              
              <Card 
                onClick={() => navigate(currentService.route)}
                className="w-48 cursor-pointer hover:shadow-sanad transition-all bg-card border-border"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-primary mb-4 flex justify-center">
                    <CurrentIcon />
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{currentService.name}</p>
                </CardContent>
              </Card>

              <button 
                onClick={prevService}
                className="shrink-0 text-primary hover:text-primary/70 transition-colors"
              >
                <ChevronRight className="w-10 h-10" strokeWidth={2.5} />
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {otherServices.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentServiceIndex(index)}
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    index === currentServiceIndex 
                      ? 'bg-primary border-primary' 
                      : 'bg-transparent border-primary/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
