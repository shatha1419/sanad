import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceCategoryProps {
  icon: ReactNode;
  title: string;
  color: string;
  bgColor: string;
  children: ReactNode;
}

export function ServiceCategory({ icon, title, color, bgColor, children }: ServiceCategoryProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${bgColor} py-4`}>
        <CardTitle className={`flex items-center gap-3 text-lg ${color}`}>
          <div className={`w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center`}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}
