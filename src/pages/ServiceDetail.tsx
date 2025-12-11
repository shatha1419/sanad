import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { ArrowRight, FileText, Clock, CheckCircle, Loader2, Bot, Zap, MessageCircle, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAgentAction } from '@/hooks/useAgentAction';
import { toast } from 'sonner';
import { ServiceExecutionForm } from '@/components/services/ServiceExecutionForm';
import { supabase } from '@/integrations/supabase/client';
import { addServiceAppointment } from '@/components/AppointmentCalendar';
import { addDays } from 'date-fns';
// Service requirements configuration
const SERVICE_REQUIREMENTS: Record<string, { id: string; name: string; type: 'file' | 'image' | 'text' | 'select'; required: boolean; description?: string; options?: string[] }[]> = {
  renew_license: [
    { id: 'id_image', name: 'صورة الهوية الوطنية', type: 'image', required: true, description: 'صورة واضحة من الأمام' },
    { id: 'personal_photo', name: 'صورة شخصية حديثة', type: 'image', required: true, description: 'خلفية بيضاء، 4x6' },
    { id: 'medical_report', name: 'التقرير الطبي', type: 'file', required: false, description: 'إن وجد' },
  ],
  check_violations: [
    { id: 'plate_number', name: 'رقم اللوحة', type: 'text', required: true },
  ],
  issue_license: [
    { id: 'id_image', name: 'صورة الهوية الوطنية', type: 'image', required: true },
    { id: 'personal_photo', name: 'صورة شخصية', type: 'image', required: true },
    { id: 'medical_report', name: 'التقرير الطبي', type: 'file', required: true },
    { id: 'training_certificate', name: 'شهادة التدريب', type: 'file', required: true },
  ],
  passport_services: [
    { id: 'id_image', name: 'صورة الهوية الوطنية', type: 'image', required: true },
    { id: 'personal_photo', name: 'صورة شخصية', type: 'image', required: true },
    { id: 'old_passport', name: 'صورة الجواز القديم', type: 'image', required: false },
  ],
  default: [
    { id: 'id_image', name: 'صورة الهوية الوطنية', type: 'image', required: true },
    { id: 'notes', name: 'ملاحظات إضافية', type: 'text', required: false },
  ],
};

export default function ServiceDetail() {
  const { categoryId, serviceId } = useParams<{ categoryId: string; serviceId: string }>();
  const navigate = useNavigate();
  const { executeAction, loading: isExecuting } = useAgentAction();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resultData, setResultData] = useState<unknown>(null);
  const [executionMode, setExecutionMode] = useState<'auto' | 'agent' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = categoryId ? SERVICES[categoryId] : null;
  
  // Find service (including sub-services)
  let service: ServiceItem | undefined;
  if (category) {
    service = category.services.find(s => s.id === serviceId);
    if (!service) {
      for (const s of category.services) {
        if (s.subServices) {
          service = s.subServices.find(sub => sub.id === serviceId);
          if (service) break;
        }
      }
    }
  }

  if (!category || !service) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">الخدمة غير موجودة</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            العودة للرئيسية
          </Button>
        </div>
      </Layout>
    );
  }

  const requirements = SERVICE_REQUIREMENTS[serviceId || ''] || SERVICE_REQUIREMENTS.default;

  const handleExecuteAuto = () => {
    setExecutionMode('auto');
    setShowForm(true);
  };

  // Services that require appointments
  const servicesWithAppointments = ['renew_license', 'issue_license', 'passport_services', 'renew_id'];
  const needsAppointment = serviceId && servicesWithAppointments.includes(serviceId);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // Create service request
      const { data: requestData, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          service_type: service?.name || '',
          service_category: categoryId || '',
          status: 'pending',
          request_data: {
            ...data,
            execution_type: executionMode,
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-create appointment for services that need it
      if (needsAppointment) {
        try {
          const appointmentDate = addDays(new Date(), 7); // Schedule for 7 days later
          await addServiceAppointment(
            user.id,
            serviceId || '',
            `موعد ${service?.name}`,
            appointmentDate,
            '10:00',
            'إدارة المرور - الرياض'
          );
          toast.success('تم حجز موعد تلقائياً في التقويم');
        } catch (appointmentError) {
          console.error('Error creating appointment:', appointmentError);
          // Don't fail the whole request if appointment fails
        }
      }

      // Execute agent tool if available
      if (service?.agentTool) {
        const result = await executeAction(service.agentTool, data);
        if (result) {
          setResultData(result);
          
          // Update request with result
          await supabase
            .from('service_requests')
            .update({
              status: 'completed',
              result_data: JSON.parse(JSON.stringify(result)),
            })
            .eq('id', requestData.id);
        }
      } else {
        setResultData({ request_number: `R${Date.now().toString().slice(-6)}` });
        
        // Update status
        await supabase
          .from('service_requests')
          .update({ status: 'processing' })
          .eq('id', requestData.id);
      }

      toast.success('تم تقديم طلبك بنجاح');
      setShowForm(false);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error submitting service request:', error);
      toast.error('حدث خطأ أثناء تقديم الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteWithAgent = () => {
    setExecutionMode('agent');
    // Open chat with service context
    const event = new CustomEvent('openChatWithContext', {
      detail: {
        service: service?.name,
        serviceId: serviceId,
        category: category?.name,
        message: `أريد المساعدة في خدمة: ${service?.name}`
      }
    });
    window.dispatchEvent(event);
    toast.info('تم فتح المحادثة مع المساعد سَنَد');
  };

  if (showSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold text-primary mb-2">تهانينا</h1>
            <p className="text-muted-foreground mb-8">
              {executionMode === 'auto' ? 'تم تنفيذ الخدمة بنجاح تلقائياً' : 'تم تنفيذ الخدمة بنجاح عبر سَنَد'}
            </p>

            {resultData && (
              <Card className="mb-6 text-right">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-foreground font-medium">#{(resultData as { request_number?: string })?.request_number || Date.now().toString().slice(-8)}</span>
                    <span className="text-muted-foreground">رقم الطلب</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground font-medium">{service.name}</span>
                    <span className="text-muted-foreground">الخدمة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground font-medium">البريد السعودي سُبل</span>
                    <span className="text-muted-foreground">طريقة الاستلام</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground font-medium">٧ أيام عمل</span>
                    <span className="text-muted-foreground">المدة</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/requests')} 
                variant="outline"
                className="w-full rounded-full py-6"
              >
                متابعة طلباتي
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full gradient-primary text-primary-foreground rounded-full py-6"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (showForm) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowForm(false)}
              className="shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <span className="text-xs text-muted-foreground">{category.name}</span>
              <h1 className="text-xl font-bold text-foreground">{service.name}</h1>
            </div>
          </div>

          <ServiceExecutionForm
            serviceName={service.name}
            requirements={requirements}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting || isExecuting}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/services/${categoryId}`)}
            className="shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <span className="text-xs text-muted-foreground">{category.name}</span>
            <h1 className="text-xl font-bold text-foreground">{service.name}</h1>
          </div>
        </div>

        {/* Service Info */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-right leading-relaxed">
              {service.description}
            </p>
          </CardContent>
        </Card>

        {/* Requirements Preview */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">المتطلبات</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-center gap-3 text-right">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <span className="text-foreground">{req.name}</span>
                    {req.required && <span className="text-destructive text-xs mr-1">*</span>}
                    {req.description && (
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 text-right pt-2 border-t border-border">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground">مدة التنفيذ: 3-5 أيام عمل</span>
              </div>
              {needsAppointment && (
                <div className="flex items-center gap-3 text-right pt-2 border-t border-border">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground text-sm">سيتم حجز موعد تلقائياً في التقويم</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Execution Options */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">طريقة التنفيذ</h2>
          
          {/* Auto Execute Option */}
          <Card 
            className="cursor-pointer hover:shadow-sanad transition-all border-2 hover:border-primary/50"
            onClick={handleExecuteAuto}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-foreground mb-1">تنفيذ تلقائي</h3>
                  <p className="text-sm text-muted-foreground">تنفيذ الخدمة مباشرة مثل أبشر - أدخل البيانات والمستندات المطلوبة</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-180" />
              </div>
            </CardContent>
          </Card>

          {/* Agent Execute Option */}
          <Card 
            className="cursor-pointer hover:shadow-sanad transition-all border-2 hover:border-secondary/50"
            onClick={handleExecuteWithAgent}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-foreground mb-1">تنفيذ عبر سَنَد</h3>
                  <p className="text-sm text-muted-foreground">دع المساعد الذكي سَنَد يساعدك في تنفيذ الخدمة خطوة بخطوة</p>
                </div>
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}