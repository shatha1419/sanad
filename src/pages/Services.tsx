import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SERVICES, ServiceItem } from '@/lib/constants';
import { Car, IdCard, BookOpen, ChevronLeft, ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/BackButton';
import { ServiceExecutionDialog } from '@/components/services/ServiceExecutionDialog';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  IdCard,
  BookOpen,
};

export default function Services() {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubService, setExpandedSubService] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleServiceClick = (service: ServiceItem, categoryId: string) => {
    if (service.actionType === 'chat') {
      navigate('/chat', { state: { initialMessage: `أريد ${service.name}` } });
    } else if (service.actionType === 'view' && service.subServices) {
      setExpandedSubService(expandedSubService === service.id ? null : service.id);
    } else {
      // Open the service execution dialog
      setSelectedService(service);
      setSelectedCategory(categoryId);
      setDialogOpen(true);
    }
  };

  const categories = Object.values(SERVICES);

  return (
    <Layout>
      <div className="p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground">الخدمات</h1>
            <p className="text-muted-foreground text-sm">
              اختر الخدمة المطلوبة لتنفيذها
            </p>
          </div>
        </div>

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
                              {service.fees && service.fees !== 'مجاني' && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                                  {service.fees}
                                </span>
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
                                    {subService.fees && subService.fees !== 'مجاني' && (
                                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                                        {subService.fees}
                                      </span>
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

      {/* Service Execution Dialog */}
      <ServiceExecutionDialog
        service={selectedService}
        category={selectedCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Layout>
  );
}