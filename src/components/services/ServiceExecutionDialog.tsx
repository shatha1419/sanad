import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Mic,
  MicOff,
  AlertTriangle,
} from 'lucide-react';

import { DEMO_USERS } from '@/lib/constants';

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
  const [selectedViolation, setSelectedViolation] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [userViolations, setUserViolations] = useState<Array<{
    id: string;
    number: string;
    type: string;
    amount: number;
    date: string;
    location: string;
  }>>([]);

  // Get user violations from DEMO_USERS
  useEffect(() => {
    if (user) {
      // Find user in DEMO_USERS by matching profile
      const demoUser = Object.values(DEMO_USERS).find(u => {
        // We need to match by some identifier - check profiles
        return u.violations && u.violations.length > 0;
      });
      
      // For now, get violations from first user with violations or use default
      const allViolations = Object.values(DEMO_USERS).flatMap(u => u.violations || []);
      setUserViolations(allViolations.length > 0 ? allViolations : [
        { id: 'V001', number: 'MV-2024-001', type: 'تجاوز السرعة المحددة', amount: 150, date: '2024-01-15', location: 'طريق الملك فهد' },
        { id: 'V002', number: 'MV-2024-002', type: 'قطع إشارة حمراء', amount: 500, date: '2024-02-20', location: 'تقاطع العليا' },
      ]);
    }
  }, [user]);
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.lang = 'ar-SA';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({ ...prev, reason: transcript }));
        setIsRecording(false);
        toast.success('تم تسجيل الاعتراض بنجاح');
      };
      
      recognitionInstance.onerror = () => {
        setIsRecording(false);
        toast.error('حدث خطأ في التسجيل الصوتي');
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognition) {
      toast.error('المتصفح لا يدعم التسجيل الصوتي');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      toast.info('تحدث الآن... قل سبب الاعتراض');
    }
  };

  // Check if service potentially has fees based on the fees string
  const potentiallyHasFees = service.fees && service.fees !== 'مجاني' && service.fees !== 'بدون رسوم';

  const handleNext = async () => {
    // Validate required fields first
    const fields = getFormFields();
    const missingFields = fields.filter(f => f.required && !formData[f.id]);
    
    if (missingFields.length > 0) {
      toast.error(`يرجى تعبئة الحقول المطلوبة: ${missingFields.map(f => f.label).join('، ')}`);
      return;
    }

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

      // Execute service via edge function - it handles saving to service_requests
      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          action: 'execute_tool',
          tool: service.agentTool,
          args: { ...formData, payment_method: selectedPayment },
          userId: user.id,
          serviceName: service.name,
          serviceCategory: category,
        },
      });

      if (error) throw error;

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

  interface FormField {
    id: string;
    label: string;
    type: string;
    options?: { value: string; label: string }[];
    required?: boolean;
  }

  const getFormFields = (): FormField[] => {
    switch (service.agentTool) {
      case 'renew_license':
        return [
          { id: 'duration_years', label: 'مدة التجديد', type: 'select', options: [{ value: '5', label: '5 سنوات - 200 ريال' }, { value: '10', label: '10 سنوات - 400 ريال' }], required: true },
        ];
      case 'renew_passport':
        return [
          { id: 'duration_years', label: 'مدة الجواز', type: 'select', options: [{ value: '5', label: '5 سنوات - 300 ريال' }, { value: '10', label: '10 سنوات - 600 ريال' }], required: true },
        ];
      case 'renew_id':
        return [
          { id: 'delivery_type', label: 'طريقة الاستلام', type: 'select', options: [{ value: 'mail', label: 'توصيل للعنوان الوطني' }, { value: 'office', label: 'استلام من الفرع' }], required: true },
        ];
      case 'exit_reentry_visa':
        return [
          { id: 'visa_type', label: 'نوع التأشيرة', type: 'select', options: [{ value: 'single', label: 'مفردة - 200 ريال' }, { value: 'multiple', label: 'متعددة - 500 ريال' }], required: true },
          { id: 'duration_months', label: 'المدة (بالأشهر)', type: 'select', options: [{ value: '2', label: 'شهرين' }, { value: '3', label: '3 أشهر' }, { value: '6', label: '6 أشهر' }], required: true },
        ];
      case 'book_appointment':
        return [
          { id: 'preferred_date', label: 'التاريخ المفضل', type: 'date', required: true },
        ];
      case 'violation_objection':
        return [
          { id: 'violation_number', label: 'رقم المخالفة', type: 'violation_select', required: true },
          { id: 'reason', label: 'سبب الاعتراض', type: 'voice_text', required: true },
        ];
      case 'register_newborn':
        return [
          { id: 'baby_name', label: 'اسم المولود (رباعي)', type: 'text', required: true },
          { id: 'baby_gender', label: 'الجنس', type: 'select', options: [{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }], required: true },
          { id: 'birth_date', label: 'تاريخ الميلاد', type: 'date', required: true },
          { id: 'birth_place', label: 'مكان الولادة', type: 'text', required: true },
          { id: 'hospital_name', label: 'اسم المستشفى', type: 'text', required: true },
        ];
      case 'transfer_vehicle_ownership':
        return [
          { id: 'buyer_id', label: 'رقم هوية المشتري', type: 'text', required: true },
          { id: 'plate_number', label: 'رقم لوحة المركبة', type: 'text', required: true },
          { id: 'sale_price', label: 'مبلغ البيع (ريال)', type: 'text' },
        ];
      case 'update_qualification':
        return [
          { id: 'qualification', label: 'المؤهل الجديد', type: 'select', options: [
            { value: 'phd', label: 'دكتوراه' },
            { value: 'masters', label: 'ماجستير' },
            { value: 'bachelors', label: 'بكالوريوس' },
            { value: 'diploma', label: 'دبلوم' },
            { value: 'highschool', label: 'ثانوية' },
          ], required: true },
          { id: 'institution', label: 'الجهة المانحة', type: 'text', required: true },
          { id: 'graduation_year', label: 'سنة التخرج', type: 'text' },
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
                          <Label htmlFor={field.id} className="text-right block flex items-center gap-1 justify-end">
                            {field.required && <span className="text-destructive">*</span>}
                            {field.label}
                          </Label>
                          
                          {/* Violation Selection */}
                          {field.type === 'violation_select' && (
                            <div className="space-y-3">
                              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-right">
                                <div className="flex items-center gap-2 justify-end mb-2">
                                  <span className="font-medium text-amber-700 dark:text-amber-400">المخالفات المسجلة</span>
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <p className="text-xs text-muted-foreground">اختر المخالفة التي تريد الاعتراض عليها</p>
                              </div>
                              
                              <RadioGroup
                                value={formData[field.id] || ''}
                                onValueChange={(value) => setFormData((prev) => ({ ...prev, [field.id]: value }))}
                                className="space-y-2"
                              >
                                {userViolations.length > 0 ? userViolations.map((violation) => (
                                  <div key={violation.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                    formData[field.id] === violation.number 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-border hover:border-primary/50'
                                  }`}>
                                    <RadioGroupItem value={violation.number} id={violation.id} />
                                    <Label htmlFor={violation.id} className="flex-1 cursor-pointer">
                                      <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="text-amber-600">{violation.amount} ريال</Badge>
                                        <div className="text-right">
                                          <p className="font-medium text-sm">{violation.type}</p>
                                          <p className="text-xs text-muted-foreground">{violation.location} - {violation.date}</p>
                                          <p className="text-xs text-muted-foreground">رقم: {violation.number}</p>
                                        </div>
                                      </div>
                                    </Label>
                                  </div>
                                )) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <p>لا توجد مخالفات مسجلة عليك</p>
                                  </div>
                                )}
                              </RadioGroup>
                            </div>
                          )}
                          
                          {/* Voice Text Input */}
                          {field.type === 'voice_text' && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={isRecording ? "destructive" : "outline"}
                                  size="icon"
                                  onClick={toggleVoiceRecording}
                                  className="shrink-0"
                                >
                                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </Button>
                                <Textarea
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  className="text-right min-h-[80px]"
                                  placeholder={isRecording ? "جاري التسجيل... تحدث الآن" : "اكتب سبب الاعتراض أو اضغط على الميكروفون للإدخال الصوتي"}
                                />
                              </div>
                              {isRecording && (
                                <div className="flex items-center gap-2 text-xs text-primary animate-pulse justify-end">
                                  <span>جاري الاستماع...</span>
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Regular Select */}
                          {field.type === 'select' && (
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
                          )}
                          
                          {/* Date Input */}
                          {field.type === 'date' && (
                            <Input
                              id={field.id}
                              type="date"
                              value={formData[field.id] || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              className="text-right"
                            />
                          )}
                          
                          {/* Text Input */}
                          {field.type === 'text' && (
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
                      ? 'تم بنجاح! ✅'
                      : result.status === 'error'
                      ? 'حدث خطأ'
                      : 'قيد المعالجة'}
                  </h3>
                </div>
                
                {/* Formatted result message */}
                <div className="text-center space-y-3">
                  <p className="text-base font-medium">{result.message}</p>
                  
                  {result.data && Object.keys(result.data).length > 0 && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mt-4 text-right space-y-2">
                      {Object.entries(result.data).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                          return null; // Skip complex objects
                        }
                        const label = key.replace(/_/g, ' ');
                        const icon = key.includes('رقم') ? '📄' : 
                                     key.includes('رسوم') ? '💰' : 
                                     key.includes('حالة') ? '✅' : 
                                     key.includes('تاريخ') ? '📅' :
                                     key.includes('اسم') ? '👤' : '📌';
                        return (
                          <div key={key} className="flex items-center justify-between py-1 border-b border-green-100 dark:border-green-900 last:border-0">
                            <span className="font-semibold">{String(value)}</span>
                            <span className="text-muted-foreground text-sm">{icon} {label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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
