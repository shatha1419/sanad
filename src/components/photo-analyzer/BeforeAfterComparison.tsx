import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ImageIcon } from 'lucide-react';

interface BeforeAfterComparisonProps {
  beforeImage: string;
  afterImage: string;
  appliedFixes: string[];
}

const fixLabels: Record<string, string> = {
  lighting: 'تحسين الإضاءة',
  background: 'تغيير الخلفية',
  crop: 'قص الصورة',
};

export function BeforeAfterComparison({ beforeImage, afterImage, appliedFixes }: BeforeAfterComparisonProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          مقارنة قبل وبعد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2 text-center">قبل</p>
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
              <img src={beforeImage} alt="قبل" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="w-6 h-6 text-primary" />
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2 text-center">بعد</p>
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden border-2 border-green-500">
              <img src={afterImage} alt="بعد" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {appliedFixes.length > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm font-medium text-green-700 mb-2">التحسينات المطبقة:</p>
            <div className="flex flex-wrap gap-2">
              {appliedFixes.map((fix) => (
                <span key={fix} className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded-full">
                  {fixLabels[fix] || fix}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
