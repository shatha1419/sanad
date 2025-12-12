import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { ArrowRight, ChevronLeft, ChevronDown, BookOpen, Car, IdCard, FileText, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { BackButton } from '@/components/BackButton';
import { ServiceExecutionDialog } from '@/components/services/ServiceExecutionDialog';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Car: <Car className="w-6 h-6" />,
  IdCard: <IdCard className="w-6 h-6" />,
};

export default function ServiceCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleServiceClick = (service: ServiceItem) => {
    if (service.subServices && service.subServices.length > 0) {
      // Toggle expansion for services with sub-services
      setExpandedService(expandedService === service.id ? null : service.id);
    } else if (service.actionType === 'chat') {
      // Navigate to chat with initial message
      navigate('/chat', { state: { initialMessage: `أريد ${service.name}` } });
    } else {
      // Open the service execution dialog
      setSelectedService(service);
      setDialogOpen(true);
    }
  };

  return (
    <Layout>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', category.bgColor)}>
              <span className={category.color}>{iconMap[category.icon]}</span>
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
                className="cursor-pointer hover:shadow-sanad transition-all duration-200 bg-card border-border overflow-hidden"
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary/70" />
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        {service.fees && service.fees !== 'مجاني' && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {service.fees}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{service.description}</p>
                    </div>
                    {service.subServices && service.subServices.length > 0 ? (
                      <ChevronDown className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform flex-shrink-0',
                        expandedService === service.id && 'rotate-180'
                      )} />
                    ) : (
                      <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sub-services */}
              {service.subServices && expandedService === service.id && (
                <div className="mr-4 mt-2 space-y-2 animate-fade-in border-r-2 border-primary/20 pr-4">
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
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-primary/60" />
                          </div>
                          <div className="flex-1 text-right min-w-0">
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <h4 className="text-sm font-medium text-foreground">{subService.name}</h4>
                              {subService.fees && subService.fees !== 'مجاني' && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                                  {subService.fees}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{subService.description}</p>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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

      {/* Service Execution Dialog */}
      <ServiceExecutionDialog
        service={selectedService}
        category={categoryId || ''}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Layout>
  );
}
