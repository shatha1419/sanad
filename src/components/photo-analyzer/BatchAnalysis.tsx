import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle, Images, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnalysisResult } from './types';

interface BatchImage {
  id: string;
  imageBase64: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
  error?: string;
}

interface BatchAnalysisProps {
  images: string[];
  onComplete: () => void;
  onCancel: () => void;
}

export function BatchAnalysis({ images, onComplete, onCancel }: BatchAnalysisProps) {
  const { toast } = useToast();
  const [batchImages, setBatchImages] = useState<BatchImage[]>(
    images.map((img, i) => ({
      id: `img-${i}`,
      imageBase64: img,
      status: 'pending',
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const startBatchAnalysis = async () => {
    setIsProcessing(true);

    for (let i = 0; i < batchImages.length; i++) {
      setCurrentIndex(i);
      
      setBatchImages(prev => prev.map((img, idx) => 
        idx === i ? { ...img, status: 'analyzing' } : img
      ));

      try {
        const { data, error } = await supabase.functions.invoke('analyze-photo', {
          body: { imageBase64: batchImages[i].imageBase64, action: 'analyze' }
        });

        if (error) throw error;

        if (data.success && data.result) {
          setBatchImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'done', result: data.result } : img
          ));
        } else {
          throw new Error(data.error || 'فشل التحليل');
        }
      } catch (error: any) {
        setBatchImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'error', error: error.message } : img
        ));
      }

      // Small delay between requests to avoid rate limiting
      if (i < batchImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsProcessing(false);
    toast({
      title: 'اكتمل التحليل',
      description: `تم تحليل ${batchImages.length} صورة`,
    });
  };

  const getVerdictIcon = (verdict?: string) => {
    switch (verdict) {
      case 'APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'FIXABLE':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getVerdictLabel = (verdict?: string) => {
    switch (verdict) {
      case 'APPROVED':
        return 'مقبولة';
      case 'FIXABLE':
        return 'قابلة للتحسين';
      case 'NEEDS_USER_ACTION':
        return 'تحتاج تعديل';
      default:
        return 'مرفوضة';
    }
  };

  const completedCount = batchImages.filter(img => img.status === 'done').length;
  const approvedCount = batchImages.filter(img => img.result?.verdict === 'APPROVED').length;
  const progress = (completedCount / batchImages.length) * 100;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Images className="w-5 h-5 text-primary" />
          تحليل دفعة صور ({batchImages.length} صور)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">جاري التحليل...</span>
              <span className="font-medium">{completedCount}/{batchImages.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary when done */}
        {!isProcessing && completedCount === batchImages.length && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-lg font-bold text-foreground mb-1">
              {approvedCount} من {batchImages.length} مقبولة
            </p>
            <p className="text-sm text-muted-foreground">
              {batchImages.length - approvedCount > 0 
                ? `${batchImages.length - approvedCount} صور تحتاج تحسين`
                : 'جميع الصور مقبولة!'
              }
            </p>
          </div>
        )}

        {/* Image Grid */}
        <ScrollArea className="h-64">
          <div className="grid grid-cols-3 gap-2">
            {batchImages.map((img, idx) => (
              <div 
                key={img.id}
                className={`relative rounded-lg overflow-hidden border-2 ${
                  img.status === 'analyzing' 
                    ? 'border-primary animate-pulse' 
                    : img.status === 'done'
                    ? img.result?.verdict === 'APPROVED' 
                      ? 'border-green-500' 
                      : 'border-yellow-500'
                    : img.status === 'error'
                    ? 'border-red-500'
                    : 'border-border'
                }`}
              >
                <div className="aspect-[3/4]">
                  <img 
                    src={img.imageBase64} 
                    alt={`صورة ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Status overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  {img.status === 'pending' && (
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                      {idx + 1}
                    </span>
                  )}
                  {img.status === 'analyzing' && (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  )}
                  {img.status === 'done' && img.result && (
                    <div className="text-center">
                      {getVerdictIcon(img.result.verdict)}
                      <p className="text-white text-xs mt-1">
                        {img.result.overall_confidence}%
                      </p>
                    </div>
                  )}
                  {img.status === 'error' && (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3">
          {!isProcessing && completedCount < batchImages.length && (
            <>
              <Button onClick={startBatchAnalysis} className="flex-1">
                <Images className="w-4 h-4 ml-2" />
                بدء التحليل
              </Button>
              <Button variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
            </>
          )}
          
          {!isProcessing && completedCount === batchImages.length && (
            <Button onClick={onComplete} className="flex-1">
              <CheckCircle2 className="w-4 h-4 ml-2" />
              تم
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
