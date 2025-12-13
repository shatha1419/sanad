import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, X, ClipboardCheck } from 'lucide-react';
import { Analysis, CRITERIA_LABELS } from './types';

interface AnalysisDetailsProps {
  analysis: Analysis;
}

export function AnalysisDetails({ analysis }: AnalysisDetailsProps) {
  const entries = Object.entries(analysis) as [keyof Analysis, { passed: boolean; confidence: number; details: string }][];

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          نتائج التحليل
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {value.passed ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="font-medium text-foreground">{CRITERIA_LABELS[key]}</span>
                </div>
                <span className={`font-bold text-sm ${value.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {value.confidence}%
                </span>
              </div>
              <div className="mr-8">
                <Progress
                  value={value.confidence}
                  className={`h-1.5 ${value.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
                />
                <p className="text-xs text-muted-foreground mt-1">{value.details}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
