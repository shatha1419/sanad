import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SERVICES } from '@/lib/constants';
import { Search, BookOpen, Car, IdCard, Mic } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_USERS } from '@/lib/constants';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-10 h-10" />,
  Car: <Car className="w-10 h-10" />,
  IdCard: <IdCard className="w-10 h-10" />,
};

const categoryColors: Record<string, string> = {
  passports: 'text-primary',
  traffic: 'text-primary',
  civil_affairs: 'text-primary',
};

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get user profile data
  const nationalId = user?.email?.replace('@sanad.gov.sa', '') || '';
  const userData = DEMO_USERS[nationalId];

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/services/${categoryId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Header */}
        <section className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="text-right">
              <p className="text-muted-foreground text-sm">أهلاً وسهلاً،</p>
              <h2 className="text-lg font-bold text-foreground">
                {userData?.fullName || 'مستخدم سَنَد'}
              </h2>
            </div>
          </div>

          {/* Hero Title */}
          <div className="text-right mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              المساعد سَنَد
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              مساعدك الذكي للخدمات الحكومية، أرشد وأنفذ عنك الإجراءات الروتينية في خطوة واحدة فقط
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-card rounded-full border border-border shadow-sm overflow-hidden">
              <button className="p-4 text-primary hover:bg-muted transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <Input
                placeholder="اكتب المهمة أو الاستفسار اللي تبغاني أساعدك فيه"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-right pr-4"
              />
              <button className="p-4 text-muted-foreground hover:bg-muted transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-bold text-foreground text-center mb-6">الخدمات</h2>
          
          {/* Service Categories - 3 Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {Object.values(SERVICES).map((category) => (
              <Card
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="cursor-pointer hover:shadow-sanad transition-all duration-300 hover:-translate-y-1 group bg-card border-border"
              >
                <CardContent className="p-4 text-center">
                  <div className={`mx-auto mb-2 ${categoryColors[category.id]}`}>
                    {iconMap[category.icon]}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Services Section */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-bold text-foreground text-center mb-6">الخدمات الأكثر شيوعًا</h2>
          
          <div className="space-y-4">
            {/* Popular Service 1 */}
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <IdCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-xs text-muted-foreground">الأحوال المدنية</span>
                    <h3 className="font-bold text-foreground mb-1">تجديد الهوية الوطنية</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      عبر هذه الخدمة يتم تجديد الهوية الوطنية تلقائياً عبر المساعد سند بعد رفع كافة الوثائق المطلوبة للتجديد
                    </p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => navigate('/services/civil_affairs')}
                        className="px-4 py-2 gradient-primary text-primary-foreground rounded-full text-sm font-medium"
                      >
                        اطلب الخدمة
                      </button>
                      <button className="text-sm text-primary underline">
                        الاطلاع على الوثائق المطلوبة
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Service 2 */}
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-xs text-muted-foreground">الجوازات</span>
                    <h3 className="font-bold text-foreground mb-1">إصدار جواز سفر لأول مرة</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      عبر هذه الخدمة يتم إصدار جواز سفر لمن لم يسبق لهم استخراجه فوق ٢١ عاماً تلقائياً عبر المساعد سند بعد رفع كافة الوثائق المطلوبة
                    </p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => navigate('/services/passports')}
                        className="px-4 py-2 gradient-primary text-primary-foreground rounded-full text-sm font-medium"
                      >
                        اطلب الخدمة
                      </button>
                      <button className="text-sm text-primary underline">
                        الاطلاع على الوثائق المطلوبة
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Service 3 */}
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-xs text-muted-foreground">المرور</span>
                    <h3 className="font-bold text-foreground mb-1">تجديد رخصة القيادة</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      عبر هذه الخدمة يتم تجديد رخصة القيادة المنتهية أو قريبة الانتهاء تلقائياً عبر المساعد سند
                    </p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => navigate('/services/traffic')}
                        className="px-4 py-2 gradient-primary text-primary-foreground rounded-full text-sm font-medium"
                      >
                        اطلب الخدمة
                      </button>
                      <button className="text-sm text-primary underline">
                        الاطلاع على الوثائق المطلوبة
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
