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
}

export function ServiceExecutionDialog({
  service,
  category,
  open,
  onOpenChange,
}: ServiceExecutionDialogProps) {
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!service) return null;

  const handleExecute = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      // Execute service via edge function
      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          action: 'execute_tool',
          tool: service.agentTool,
          args: formData,
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
        request_data: { ...formData, execution_type: 'direct' },
        result_data: data.data || null,
      });

      if (saveError) {
        console.error('Error saving request:', saveError);
      }

      setResult(data);
      
      if (data.status === 'success') {
        toast.success('تم تنفيذ الخدمة بنجاح');
      }
    } catch (error) {
      console.error('Execution error:', error);
      setResult({
        status: 'error',
        message: 'حدث خطأ أثناء تنفيذ الخدمة',
      });
      toast.error('حدث خطأ أثناء تنفيذ الخدمة');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setFormData({});
    onOpenChange(false);
  };

  const getFormFields = () => {
    switch (service.agentTool) {
      case 'renew_license':
        return [
          { id: 'duration_years', label: 'مدة التجديد', type: 'select', options: [{ value: '5', label: '5 سنوات' }, { value: '10', label: '10 سنوات' }] },
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl text-right">{service.name}</DialogTitle>
          <DialogDescription className="text-right">
            {service.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {/* Service Info */}
            {!result && (
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

                <Separator />

                {/* Form Fields */}
                {formFields.length > 0 && (
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
                )}
              </>
            )}

            {/* Result */}
            {result && (
              <div
                className={`rounded-lg p-4 ${
                  result.status === 'success'
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : result.status === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-3 justify-end">
                  <span className="font-semibold">
                    {result.status === 'success'
                      ? 'تم بنجاح'
                      : result.status === 'error'
                      ? 'حدث خطأ'
                      : 'قيد المعالجة'}
                  </span>
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : result.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-right">{result.message}</p>

                {result.data && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {Object.entries(result.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <Badge variant="secondary">{String(value)}</Badge>
                        <span className="text-muted-foreground">
                          {key === 'request_number'
                            ? 'رقم الطلب'
                            : key === 'fees'
                            ? 'الرسوم'
                            : key === 'duration'
                            ? 'المدة'
                            : key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button
                onClick={handleExecute}
                disabled={isExecuting}
                className="gradient-primary text-primary-foreground"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري التنفيذ...
                  </>
                ) : (
                  'تنفيذ الخدمة'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
