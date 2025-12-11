import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SERVICES, QUICK_SUGGESTIONS } from '@/lib/constants';
import { MessageSquare, BookOpen, Car, IdCard, ArrowLeft, Sparkles } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Car: <Car className="w-6 h-6" />,
  IdCard: <IdCard className="w-6 h-6" />,
};

export default function Index() {
  const navigate = useNavigate();

  const handleQuickSuggestion = (suggestion: string) => {
    navigate('/chat', { state: { initialMessage: suggestion } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 animate-fade-in">
          <div className="w-24 h-24 mx-auto gradient-primary rounded-3xl flex items-center justify-center shadow-sanad glow-sanad mb-6">
            <span className="text-primary-foreground font-bold text-5xl">س</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            مرحباً بك في <span className="text-primary">سَنَد</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            مساعدك الذكي للخدمات الحكومية. اسألني أي سؤال أو اطلب أي خدمة، وسأساعدك بكل سهولة.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/chat')}
            className="gradient-primary text-primary-foreground shadow-sanad gap-2 text-lg px-8"
          >
            <MessageSquare className="w-5 h-5" />
            ابدأ المحادثة
          </Button>
        </section>

        {/* Quick Suggestions */}
        <section className="py-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">اقتراحات سريعة</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSuggestion(suggestion)}
                className="hover:bg-primary/10 hover:border-primary transition-colors"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">الخدمات المتاحة</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/services')}
              className="gap-1 text-primary"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(SERVICES).map((category) => (
              <Card
                key={category.id}
                onClick={() => navigate('/services')}
                className="cursor-pointer hover:shadow-sanad transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 mx-auto rounded-2xl ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className={category.color}>{iconMap[category.icon]}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {category.services.length} خدمات
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xl font-bold text-foreground mb-6">ماذا يمكنني فعله لك؟</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">إجابة الأسئلة</h3>
                <p className="text-sm text-muted-foreground">
                  اسألني عن أي خدمة حكومية وسأقدم لك المعلومات الكاملة
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">تنفيذ الخدمات</h3>
                <p className="text-sm text-muted-foreground">
                  أستطيع تنفيذ الخدمات نيابةً عنك مثل حجز المواعيد والاستعلامات
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <IdCard className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">فهم المستندات</h3>
                <p className="text-sm text-muted-foreground">
                  أرسل صورة لمستند أو مخالفة وسأساعدك في فهمها
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
