import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  ArrowRight,
  Shield,
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import sanadLogo from '@/assets/sanad-new-logo.png';

const paymentMethods = [
  { id: 'visa', name: 'Visa / Mastercard', icon: CreditCard, requiresCard: true },
  { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone, requiresCard: false },
  { id: 'mada', name: 'مدى', icon: Wallet, requiresCard: true },
  { id: 'sadad', name: 'سداد', icon: Building2, requiresCard: false },
];

type PaymentStep = 'select' | 'details' | 'processing' | 'success' | 'error';

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [step, setStep] = useState<PaymentStep>('select');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  
  const amount = searchParams.get('amount') || '0';
  const serviceName = searchParams.get('service') || 'خدمة';
  const returnUrl = searchParams.get('returnUrl') || '/';
  const serviceData = searchParams.get('data') || '';

  useEffect(() => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/auth');
    }
  }, [user, navigate]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    const method = paymentMethods.find(m => m.id === methodId);
    if (method?.requiresCard) {
      setStep('details');
    } else {
      // For Apple Pay and SADAD, go directly to processing
      handleProcessPayment();
    }
  };

  const handleProcessPayment = async () => {
    setStep('processing');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 95% success rate for demo
    if (Math.random() > 0.05) {
      setStep('success');
      toast.success('تم الدفع بنجاح!');
      
      // Auto-redirect after success
      setTimeout(() => {
        const url = new URL(returnUrl, window.location.origin);
        url.searchParams.set('paymentStatus', 'success');
        url.searchParams.set('paymentMethod', selectedMethod);
        if (serviceData) {
          url.searchParams.set('data', serviceData);
        }
        navigate(url.pathname + url.search);
      }, 2000);
    } else {
      setStep('error');
      toast.error('فشلت عملية الدفع');
    }
  };

  const handleSubmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      toast.error('رقم البطاقة غير صحيح');
      return;
    }
    if (expiryDate.length !== 5) {
      toast.error('تاريخ الانتهاء غير صحيح');
      return;
    }
    if (cvv.length !== 3) {
      toast.error('رمز CVV غير صحيح');
      return;
    }
    if (!cardHolder.trim()) {
      toast.error('يرجى إدخال اسم حامل البطاقة');
      return;
    }
    
    handleProcessPayment();
  };

  const handleRetry = () => {
    setStep('select');
    setSelectedMethod('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardHolder('');
  };

  const handleCancel = () => {
    const url = new URL(returnUrl, window.location.origin);
    url.searchParams.set('paymentStatus', 'cancelled');
    navigate(url.pathname + url.search);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img src={sanadLogo} alt="سند" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">بوابة الدفع الآمنة</h1>
          <p className="text-sm text-muted-foreground mt-1">{serviceName}</p>
        </div>

        {/* Amount Display */}
        <div className="bg-primary/10 rounded-xl p-4 text-center mb-6">
          <p className="text-sm text-muted-foreground mb-1">المبلغ المطلوب</p>
          <p className="text-3xl font-bold text-primary">{amount} ريال</p>
        </div>

        <Separator className="my-4" />

        {/* Step: Select Payment Method */}
        {step === 'select' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-right">اختر طريقة الدفع</h2>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="p-4 rounded-xl border-2 border-border hover:border-primary transition-all text-right bg-card hover:bg-muted/50"
                  >
                    <Icon className="w-8 h-8 mb-2 text-primary" />
                    <p className="text-sm font-medium">{method.name}</p>
                  </button>
                );
              })}
            </div>

            <Button variant="ghost" onClick={handleCancel} className="w-full mt-4 gap-2">
              <ArrowRight className="w-4 h-4" />
              إلغاء والعودة
            </Button>
          </div>
        )}

        {/* Step: Card Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmitCard} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setStep('select')}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold">إدخال بيانات البطاقة</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">رقم البطاقة</Label>
              <Input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                className="text-left tracking-wider font-mono"
                dir="ltr"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                <Input
                  id="expiry"
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  className="text-left font-mono"
                  dir="ltr"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="•••"
                  className="text-left font-mono"
                  dir="ltr"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardHolder">اسم حامل البطاقة</Label>
              <Input
                id="cardHolder"
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="ABDULLAH MOHAMMED"
                className="text-left uppercase"
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Lock className="w-4 h-4 shrink-0" />
              <span>بياناتك محمية بتشفير SSL 256-bit</span>
            </div>

            <Button type="submit" className="w-full gradient-primary text-primary-foreground gap-2">
              <Shield className="w-4 h-4" />
              إتمام الدفع - {amount} ريال
            </Button>
          </form>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-lg font-semibold mb-2">جاري معالجة الدفع...</h2>
            <p className="text-sm text-muted-foreground">
              يرجى الانتظار وعدم إغلاق الصفحة
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-600 mb-2">تمت عملية الدفع بنجاح!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              تم خصم {amount} ريال من حسابك
            </p>
            <p className="text-xs text-muted-foreground">
              سيتم تحويلك تلقائياً...
            </p>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-600 mb-2">فشلت عملية الدفع</h2>
            <p className="text-sm text-muted-foreground mb-4">
              يرجى التحقق من بيانات البطاقة والمحاولة مرة أخرى
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                إلغاء
              </Button>
              <Button onClick={handleRetry} className="flex-1 gradient-primary text-primary-foreground">
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>آمن 100%</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>SSL مشفر</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
