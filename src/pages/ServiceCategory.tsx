import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { ArrowRight, ChevronLeft, BookOpen, Car, IdCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAgentAction } from '@/hooks/useAgentAction';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Car: <Car className="w-6 h-6" />,
  IdCard: <IdCard className="w-6 h-6" />,
};

export default function ServiceCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { executeAction, loading: isExecuting } = useAgentAction();
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [resultDialog, setResultDialog] = useState<{ open: boolean; title: string; result: unknown }>({
    open: false,
    title: '',
    result: null,
  });

  const category = categoryId ? SERVICES[categoryId] : null;

  if (!category) {
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

  const handleServiceClick = async (service: ServiceItem) => {
    if (service.subServices && service.subServices.length > 0) {
      // Toggle expansion for services with sub-services
      setExpandedService(expandedService === service.id ? null : service.id);
    } else if (service.actionType === 'direct' && service.agentTool) {
      // Execute agent action directly
      try {
        const result = await executeAction(service.agentTool);
        setResultDialog({
          open: true,
          title: service.name,
          result,
        });
      } catch (error) {
        toast.error('حدث خطأ أثناء تنفيذ الخدمة');
      }
    } else {
      // Navigate to service detail page
      navigate(`/services/${categoryId}/${service.id}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${category.color}`}>
              {iconMap[category.icon]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
              <p className="text-sm text-muted-foreground">{category.services.length} خدمة متاحة</p>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-3">
          {category.services.map((service) => (
            <div key={service.id}>
              <Card
                className="cursor-pointer hover:shadow-sanad transition-all duration-200 bg-card border-border"
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <ChevronLeft className={`w-5 h-5 text-muted-foreground transition-transform ${
                      service.subServices && expandedService === service.id ? 'rotate-90' : ''
                    }`} />
                    <div className="flex-1 text-right mr-3">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    {service.actionType === 'direct' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        تنفيذ مباشر
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sub-services */}
              {service.subServices && expandedService === service.id && (
                <div className="mr-6 mt-2 space-y-2 animate-fade-in">
                  {service.subServices.map((subService) => (
                    <Card
                      key={subService.id}
                      className="cursor-pointer hover:shadow-sm transition-all bg-muted/50 border-border"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(subService);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 text-right mr-2">
                            <h4 className="text-sm font-medium text-foreground">{subService.name}</h4>
                          </div>
                          {subService.actionType === 'direct' && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              مباشر
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {isExecuting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium">جاري تنفيذ الخدمة...</p>
          </div>
        </div>
      )}

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">{resultDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg text-right">
            <pre className="text-sm whitespace-pre-wrap direction-rtl">
              {JSON.stringify(resultDialog.result, null, 2)}
            </pre>
          </div>
          <Button onClick={() => setResultDialog({ ...resultDialog, open: false })} className="w-full gradient-primary">
            إغلاق
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
