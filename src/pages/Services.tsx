import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ServiceCategory } from '@/components/services/ServiceCategory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { useAgentAction } from '@/hooks/useAgentAction';
import { BookOpen, Car, IdCard, Plane, FileText, ChevronLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Passport: <BookOpen className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  IdCard: <IdCard className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
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

function ServiceCard({ 
  service, 
  onChatClick, 
  onDirectClick 
}: { 
  service: ServiceItem; 
  onChatClick: () => void;
  onDirectClick: () => void;
}) {
  const isDirect = service.actionType === 'direct';
  
  return (
    <Card
      onClick={isDirect ? onDirectClick : onChatClick}
      className="cursor-pointer hover:shadow-sanad transition-all duration-300 hover:-translate-y-1 group"
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
            {isDirect && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                فوري
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{service.description}</p>
        </div>
        <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}

export default function Services() {
  const navigate = useNavigate();
  const { executeAction, loading, result } = useAgentAction();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<string>('');

  const handleChatClick = (serviceName: string) => {
    navigate('/chat', { state: { initialMessage: `أريد ${serviceName}` } });
  };

  const handleDirectClick = async (service: ServiceItem) => {
    if (!service.agentTool) return;
    
    setCurrentService(service.name);
    setDialogOpen(true);
    await executeAction(service.agentTool);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">الخدمات الحكومية</h1>
          <p className="text-muted-foreground">
            اختر الخدمة التي تريدها - الخدمات المميزة بـ "فوري" تنفذ مباشرة
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Object.values(SERVICES).map((category, idx) => (
            <div
              key={category.id}
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <ServiceCategory
                icon={iconMap[category.icon]}
                title={category.name}
                color={category.color}
                bgColor={category.bgColor}
              >
                {category.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onChatClick={() => handleChatClick(service.name)}
                    onDirectClick={() => handleDirectClick(service)}
                  />
                ))}
              </ServiceCategory>
            </div>
          ))}
        </div>
      </div>

      <ActionResultDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={currentService}
        result={result}
        loading={loading}
      />
    </Layout>
  );
}
