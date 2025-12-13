import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle, Download, RotateCcw, ShieldCheck } from 'lucide-react';
import { AnalysisResult } from './types';

interface FinalVerdictProps {
  result: AnalysisResult;
  image: string;
  onDownload: () => void;
  onReset: () => void;
}

export function FinalVerdict({ result, image, onDownload, onReset }: FinalVerdictProps) {
  const { verdict, overall_confidence } = result;

  const verdictConfig = {
    APPROVED: {
      icon: ShieldCheck,
      title: 'مقبولة',
      description: 'صورتك تستوفي جميع متطلبات أبشر',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
    },
    FIXABLE: {
      icon: AlertTriangle,
      title: 'قابلة للتحسين',
      description: 'يمكن تحسين الصورة تلقائياً',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700',
    },
    NEEDS_USER_ACTION: {
      icon: AlertTriangle,
      title: 'تحتاج تعديلات',
      description: 'بعض المشاكل تحتاج تدخلك المباشر',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700',
    },
    REJECTED: {
      icon: X,
      title: 'مرفوضة',
      description: 'الصورة لا تستوفي الحد الأدنى من المتطلبات',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
    },
  };

  const config = verdictConfig[verdict];
  const VerdictIcon = config.icon;

  return (
    <Card className={`border-2 ${config.borderColor} ${config.bgColor}`}>
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mx-auto mb-4`}>
          <VerdictIcon className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        <h2 className={`text-2xl font-bold ${config.textColor} mb-2`}>
          {config.title}
        </h2>
        
        <p className="text-muted-foreground mb-4">{config.description}</p>

        <div className={`text-4xl font-bold ${config.textColor} mb-6`}>
          {overall_confidence}%
          <span className="text-sm font-normal text-muted-foreground block">نسبة الثقة</span>
        </div>

        <div className="flex gap-3 justify-center">
          {verdict === 'APPROVED' && (
            <Button onClick={onDownload} className="bg-green-600 hover:bg-green-700 text-white">
              <Download className="w-4 h-4 ml-2" />
              تحميل الصورة
            </Button>
          )}
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4 ml-2" />
            صورة جديدة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
