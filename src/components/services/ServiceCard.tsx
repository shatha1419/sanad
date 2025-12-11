import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';

interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export function ServiceCard({ icon, title, description, onClick, className = '' }: ServiceCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer hover:shadow-sanad transition-all duration-300 hover:-translate-y-1 group ${className}`}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
        <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}
