import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ServiceCategory } from '@/components/services/ServiceCategory';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SERVICES } from '@/lib/constants';
import { Passport, Car, IdCard, Plane, FileText } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Passport: <Passport className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  IdCard: <IdCard className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
};

export default function Services() {
  const navigate = useNavigate();

  const handleServiceClick = (serviceName: string) => {
    navigate('/chat', { state: { initialMessage: `أريد ${serviceName}` } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">الخدمات الحكومية</h1>
          <p className="text-muted-foreground">
            اختر الخدمة التي تريدها وسيساعدك سَنَد في إتمامها
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
                    icon={<FileText className="w-5 h-5" />}
                    title={service.name}
                    description={service.description}
                    onClick={() => handleServiceClick(service.name)}
                  />
                ))}
              </ServiceCategory>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
