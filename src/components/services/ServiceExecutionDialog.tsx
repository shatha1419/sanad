import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceItem } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  CreditCard,
  Users,
  Info,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Smartphone,
  Building2,
} from 'lucide-react';

interface ServiceExecutionDialogProps {
  service: ServiceItem | null;
  category: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExecutionResult {
  status: string;
  message: string;
  data?: Record<string, unknown>;
  fees?: number;
}

type Step = 'info' | 'payment' | 'executing' | 'result';

const paymentMethods = [
  { id: 'visa', name: 'Visa / Mastercard', icon: CreditCard },
  { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone },
  { id: 'mada', name: 'مدى', icon: Wallet },
  { id: 'sadad', name: 'سداد', icon: Building2 },
];

export function ServiceExecutionDialog({
  service,
  category,
  open,
  onOpenChange,
}: ServiceExecutionDialogProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [calculatedFees, setCalculatedFees] = useState<number>(0);

  if (!service) return null;

  // Check if service potentially has fees based on the fees string
  const potentiallyHasFees = service.fees && service.fees !== 'مجاني' && service.fees !== 'بدون رسوم';

  const handleNext = async () => {
    if (currentStep === 'info') {
      if (potentiallyHasFees) {
        // Show payment step first
        setCurrentStep('payment');
      } else {
        // Execute directly if no fees
        await handleExecute();
      }
    } else if (currentStep === 'payment') {
      if (!selectedPayment) {
        toast.error('يرجى اختيار طريقة الدفع');
        return;
      }
      await handleExecute();
    }
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('info');
    }
  };

  const handleExecute = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setCurrentStep('executing');
    setIsExecuting(true);
    setResult(null);

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Execute service via edge function
      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          action: 'execute_tool',
          tool: service.agentTool,
          args: { ...formData, payment_method: selectedPayment },
          userId: user.id,
        },
      });

      if (error) throw error;

      // Save to service_requests
      const { error: saveError } = await supabase.from('service_requests').insert({
        user_id: user.id,
        service_type: service.name,
        service_category: category,
        status: data.status === 'success' ? 'completed' : 'pending',
        request_data: { 
          ...formData, 
          execution_type: 'direct',
          payment_method: selectedPayment || null,
        },
        result_data: data.data || null,
      });

      if (saveError) {
        console.error('Error saving request:', saveError);
      }

      setResult(data);
      setCurrentStep('result');
      
      if (data.status === 'success') {
        toast.success('تم تنفيذ الخدمة بنجاح');
      }
    } catch (error) {
      console.error('Execution error:', error);
      setResult({
        status: 'error',
        message: 'حدث خطأ أثناء تنفيذ الخدمة',
      });
      setCurrentStep('result');
      toast.error('حدث خطأ أثناء تنفيذ الخدمة');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setFormData({});
    setSelectedPayment('');
    setCurrentStep('info');
    setCalculatedFees(0);
    onOpenChange(false);
  };

  const getFormFields = () => {
    switch (service.agentTool) {
      case 'renew_license':
        return [
          { id: 'duration_years', label: 'مدة التجديد', type: 'select', options: [{ value: '5', label: '5 سنوات - 200 ريال' }, { value: '10', label: '10 سنوات - 400 ريال' }] },
        ];
      case 'renew_passport':
        return [
          { id: 'duration_years', label: 'مدة الجواز', type: 'select', options: [{ value: '5', label: '5 سنوات - 300 ريال' }, { value: '10', label: '10 سنوات - 600 ريال' }] },
        ];
      case 'renew_id':
        return [
          { id: 'delivery_type', label: 'طريقة الاستلام', type: 'select', options: [{ value: 'mail', label: 'توصيل للعنوان الوطني' }, { value: 'office', label: 'استلام من الفرع' }] },
        ];
      case 'exit_reentry_visa':
        return [
          { id: 'visa_type', label: 'نوع التأشيرة', type: 'select', options: [{ value: 'single', label: 'مفردة - 200 ريال' }, { value: 'multiple', label: 'متعددة - 500 ريال' }] },
          { id: 'duration_months', label: 'المدة (بالأشهر)', type: 'select', options: [{ value: '2', label: 'شهرين' }, { value: '3', label: '3 أشهر' }, { value: '6', label: '6 أشهر' }] },
        ];
      case 'book_appointment':
        return [
          { id: 'preferred_date', label: 'التاريخ المفضل', type: 'date' },
        ];
      case 'violation_objection':
        return [
          { id: 'violation_number', label: 'رقم المخالفة', type: 'text' },
          { id: 'reason', label: 'سبب الاعتراض', type: 'text' },
        ];
      default:
        return [];
    }
  };

  const formFields = getFormFields();

  const getStepIndicator = () => {
    const steps = potentiallyHasFees 
      ? ['المعلومات', 'الدفع', 'التنفيذ', 'النتيجة']
      : ['المعلومات', 'التنفيذ', 'النتيجة'];
    
    const stepMapping = potentiallyHasFees
      ? { info: 0, payment: 1, executing: 2, result: 3 }
      : { info: 0, executing: 1, result: 2, payment: -1 };
    
    const currentIndex = stepMapping[currentStep];

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx <= currentIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx < currentIndex ? <CheckCircle className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${idx <= currentIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${idx < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl text-right">{service.name}</DialogTitle>
          <DialogDescription className="text-right">
            {service.description}
          </DialogDescription>
        </DialogHeader>

        {getStepIndicator()}

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 p-1">
            {/* Step 1: Info */}
            {currentStep === 'info' && (
              <>
                {service.conditions && service.conditions.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3 text-right">
                      <span className="font-semibold">الشروط المطلوبة</span>
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <ul className="space-y-2 text-sm text-right">
                      {service.conditions.map((condition, idx) => (
                        <li key={idx} className="flex items-center gap-2 justify-end">
                          <span>{condition}</span>
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {service.fees && (
                    <div className="bg-muted/50 rounded-lg p-3 text-right">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-xs text-muted-foreground">الرسوم</span>
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-sm">{service.fees}</p>
                    </div>
                  )}
                  {service.beneficiary && (
                    <div className="bg-muted/50 rounded-lg p-3 text-right">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-xs text-muted-foreground">المستفيدون</span>
                        <Users className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-sm">{service.beneficiary}</p>
                    </div>
                  )}
                </div>

                {service.howToAccess && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 justify-end">
                    <span>{service.howToAccess}</span>
                    <Info className="w-3 h-3 shrink-0" />
                  </div>
                )}

                {formFields.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-semibold text-right">المعلومات المطلوبة</h4>
                      {formFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id} className="text-right block">
                            {field.label}
                          </Label>
                          {field.type === 'select' ? (
                            <Select
                              value={formData[field.id] || ''}
                              onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, [field.id]: value }))
                              }
                            >
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'date' ? (
                            <Input
                              id={field.id}
                              type="date"
                              value={formData[field.id] || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              className="text-right"
                            />
                          ) : (
                            <Input
                              id={field.id}
                              type="text"
                              value={formData[field.id] || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              className="text-right"
                              placeholder={`أدخل ${field.label}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 2: Payment */}
            {currentStep === 'payment' && (
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4 text-right">
                  <p className="text-sm text-muted-foreground mb-1">المبلغ المطلوب</p>
                  <p className="text-2xl font-bold text-primary">{service.fees}</p>
                </div>

                <h4 className="font-semibold text-right">اختر طريقة الدفع</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedPayment === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-right ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 mr-auto ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {method.name}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-right text-sm text-muted-foreground">
                  <Info className="w-4 h-4 inline ml-2" />
                  سيتم تحويلك لإتمام عملية الدفع بشكل آمن
                </div>
              </div>
            )}

            {/* Step 3: Executing */}
            {currentStep === 'executing' && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">جاري تنفيذ الخدمة...</h3>
                <p className="text-muted-foreground text-sm">
                  يرجى الانتظار، قد تستغرق العملية بضع ثوانٍ
                </p>
                {selectedPayment && (
                  <p className="text-xs text-muted-foreground mt-4">
                    تم الدفع عبر: {paymentMethods.find(m => m.id === selectedPayment)?.name}
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Result */}
            {currentStep === 'result' && result && (
              <div
                className={`rounded-lg p-6 ${
                  result.status === 'success'
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : result.status === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="text-center mb-4">
                  {result.status === 'success' ? (
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
                  ) : result.status === 'error' ? (
                    <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-3" />
                  ) : (
                    <Clock className="w-16 h-16 text-amber-600 mx-auto mb-3" />
                  )}
                  <h3 className="text-xl font-bold">
                    {result.status === 'success'
                      ? 'تم بنجاح!'
                      : result.status === 'error'
                      ? 'حدث خطأ'
                      : 'قيد المعالجة'}
                  </h3>
                </div>
                <p className="text-sm text-center mb-4">{result.message}</p>

                {result.data && Object.keys(result.data).length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {Object.entries(result.data).map(([key, value]) => {
                      // Skip arrays and complex objects for now
                      if (typeof value === 'object' && value !== null) {
                        if (Array.isArray(value)) {
                          return (
                            <div key={key} className="text-sm text-right">
                              <span className="text-muted-foreground block mb-1">{key.replace(/_/g, ' ')}:</span>
                              <ul className="list-disc list-inside">
                                {value.map((item, idx) => (
                                  <li key={idx}>{String(item)}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return null;
                      }
                      return (
                        <div key={key} className="flex justify-between text-sm items-center">
                          <Badge variant="secondary" className="font-normal">{String(value)}</Badge>
                          <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground mt-4">
                  يمكنك متابعة طلبك من صفحة "طلباتي"
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentStep === 'info' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button
                onClick={handleNext}
                className="gradient-primary text-primary-foreground gap-2"
              >
                {potentiallyHasFees ? 'متابعة للدفع' : 'تنفيذ الخدمة'}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </>
          )}

          {currentStep === 'payment' && (
            <>
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedPayment}
                className="gradient-primary text-primary-foreground gap-2"
              >
                إتمام الدفع والتنفيذ
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </>
          )}

          {currentStep === 'executing' && (
            <Button disabled className="w-full gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التنفيذ...
            </Button>
          )}

          {currentStep === 'result' && (
            <Button onClick={handleClose} className="w-full">
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
