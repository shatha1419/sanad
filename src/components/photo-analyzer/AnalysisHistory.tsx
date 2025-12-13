import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, CheckCircle2, XCircle, AlertCircle, Trash2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PhotoAnalysisRecord {
  id: string;
  original_image_url: string | null;
  edited_image_url: string | null;
  verdict: string;
  overall_confidence: number;
  created_at: string;
}

interface AnalysisHistoryProps {
  onSelectAnalysis?: (record: PhotoAnalysisRecord) => void;
  compact?: boolean;
}

export function AnalysisHistory({ onSelectAnalysis, compact = false }: AnalysisHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<PhotoAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('id, original_image_url, edited_image_url, verdict, overall_confidence, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('photo_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف سجل التحليل بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف السجل',
        variant: 'destructive',
      });
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'FIXABLE':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getVerdictLabel = (verdict: string) => {
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

  if (!user) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>سجّل الدخول لعرض سجل التحليلات</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="animate-pulse">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>لا يوجد سجل تحليلات سابقة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          سجل التحليلات السابقة
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={compact ? 'h-48' : 'h-80'}>
          <div className="divide-y divide-border">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectAnalysis?.(analysis)}
              >
                {/* Thumbnail */}
                <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                  {(analysis.edited_image_url || analysis.original_image_url) ? (
                    <img 
                      src={analysis.edited_image_url || analysis.original_image_url || ''} 
                      alt="صورة"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <History className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getVerdictIcon(analysis.verdict)}
                    <span className="text-sm font-medium text-foreground">
                      {getVerdictLabel(analysis.verdict)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({analysis.overall_confidence}%)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(analysis.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(analysis.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
