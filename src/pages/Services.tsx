import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { Car, IdCard, BookOpen, ChevronLeft, ChevronDown, Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentAction } from '@/hooks/useAgentAction';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  IdCard,
  BookOpen,
};

interface ActionResultDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  result: { status: string; message: string; data?: unknown } | null;
  loading: boolean;
}

function ActionResultDialog({ open, onClose, title, result, loading }: ActionResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">جاري تنفيذ الطلب...</p>
          </div>
        ) : result ? (
          <div className="py-6 flex flex-col items-center gap-4">
            {result.status === 'success' ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <DialogDescription className="text-lg">
              {result.message}
            </DialogDescription>
            {result.data && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-right w-full">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : null}
        
        <Button onClick={onClose} className="mt-4">
          إغلاق
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function Services() {
  const navigate = useNavigate();
  const { executeAction, loading: actionLoading, result } = useAgentAction();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubService, setExpandedSubService] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<string>('');

  const handleServiceClick = async (service: ServiceItem, categoryId: string) => {
    if (service.actionType === 'chat') {
      navigate('/chat', { state: { initialMessage: `أريد ${service.name}` } });
    } else if (service.actionType === 'direct' && service.agentTool) {
      setCurrentService(service.name);
      setDialogOpen(true);
      await executeAction(service.agentTool, { serviceId: service.id, categoryId });
    } else if (service.actionType === 'view' && service.subServices) {
      setExpandedSubService(expandedSubService === service.id ? null : service.id);
    }
  };

  const categories = Object.values(SERVICES);

  return (
    <Layout>
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-2">الخدمات</h1>
        <p className="text-muted-foreground text-sm mb-6">
          اختر الخدمة - الخدمات المميزة بـ "تنفيذ مباشر" تنفذ فوراً
        </p>

        <div className="space-y-4">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || BookOpen;
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', category.bgColor)}>
                      <IconComponent className={cn('w-6 h-6', category.color)} />
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.services.length} خدمة</p>
                    </div>
                  </div>
                  <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {category.services.map((service) => (
                      <div key={service.id}>
                        <button
                          onClick={() => handleServiceClick(service, category.id)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary/70" />
                          </div>
                          <div className="text-right flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-foreground">{service.name}</h4>
                              {service.actionType === 'direct' && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">تنفيذ مباشر</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{service.description}</p>
                          </div>
                          {service.actionType === 'view' && service.subServices ? (
                            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform flex-shrink-0', expandedSubService === service.id && 'rotate-180')} />
                          ) : (
                            <ChevronLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>

                        {/* Sub-services */}
                        {service.subServices && expandedSubService === service.id && (
                          <div className="bg-muted/20 border-t border-border/50">
                            {service.subServices.map((subService) => (
                              <button
                                key={subService.id}
                                onClick={() => handleServiceClick(subService, category.id)}
                                className="w-full p-4 pr-8 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-primary/60" />
                                </div>
                                <div className="text-right flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-foreground text-sm">{subService.name}</h4>
                                    {subService.actionType === 'direct' && (
                                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">تنفيذ</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{subService.description}</p>
                                </div>
                                <ChevronLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ActionResultDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={currentService}
        result={result}
        loading={actionLoading}
      />
    </Layout>
  );
}
