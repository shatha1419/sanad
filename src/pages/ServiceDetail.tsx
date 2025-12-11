import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { ArrowRight, FileText, Clock, CheckCircle, Loader2, Bot, Zap, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAgentAction } from '@/hooks/useAgentAction';
import { toast } from 'sonner';

export default function ServiceDetail() {
  const { categoryId, serviceId } = useParams<{ categoryId: string; serviceId: string }>();
  const navigate = useNavigate();
  const { executeAction, loading: isExecuting } = useAgentAction();
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultData, setResultData] = useState<unknown>(null);
  const [executionMode, setExecutionMode] = useState<'auto' | 'agent' | null>(null);

  const category = categoryId ? SERVICES[categoryId] : null;
  
  // Find service (including sub-services)
  let service: ServiceItem | undefined;
  if (category) {
    service = category.services.find(s => s.id === serviceId);
    if (!service) {
      // Search in sub-services
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

  const handleExecuteAuto = async () => {
    setExecutionMode('auto');
    
    if (service?.agentTool) {
      try {
        const result = await executeAction(service.agentTool);
        if (result) {
          setResultData(result);
          setShowSuccess(true);
        }
      } catch (error) {
        toast.error('حدث خطأ أثناء تنفيذ الخدمة');
      }
    } else {
      // Simulate auto execution for services without agentTool
      toast.success('تم تقديم طلبك بنجاح');
      setResultData({ request_number: `R${Date.now().toString().slice(-6)}` });
      setShowSuccess(true);
    }
  };

  const handleExecuteWithAgent = () => {
    setExecutionMode('agent');
    // Open chat with service context - dispatch custom event
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
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
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

            <Button 
              onClick={() => navigate('/')} 
              className="w-full gradient-primary text-primary-foreground rounded-full py-6"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
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

        {/* Requirements */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">المتطلبات</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-right">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground">صورة من الهوية الوطنية</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground">صورة شخصية حديثة</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground">مدة التنفيذ: 3-5 أيام عمل</span>
              </div>
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
                  <p className="text-sm text-muted-foreground">تنفيذ الخدمة مباشرة مثل أبشر الحالي</p>
                </div>
                {isExecuting && executionMode === 'auto' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-180" />
                )}
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
                  <p className="text-sm text-muted-foreground">دع المساعد الذكي سَنَد ينفذ الخدمة عنك</p>
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
