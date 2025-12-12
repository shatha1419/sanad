import { CheckCircle, AlertCircle, Clock, FileText, CreditCard, MapPin, User, Calendar, Hash, Receipt, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ServiceResultData {
  status: string;
  message: string;
  data?: Record<string, unknown>;
  fees?: number;
}

interface ServiceResultDisplayProps {
  result: ServiceResultData;
  serviceName?: string;
}

// Icon mapping for result fields
const getFieldIcon = (key: string) => {
  if (key.includes('رقم') || key.includes('طلب')) return <Hash className="w-4 h-4" />;
  if (key.includes('رسوم') || key.includes('مبلغ')) return <CreditCard className="w-4 h-4" />;
  if (key.includes('حالة')) return <CheckCircle className="w-4 h-4" />;
  if (key.includes('تاريخ') || key.includes('وقت')) return <Calendar className="w-4 h-4" />;
  if (key.includes('اسم') || key.includes('مستفيد')) return <User className="w-4 h-4" />;
  if (key.includes('مكان') || key.includes('موقع') || key.includes('فرع')) return <MapPin className="w-4 h-4" />;
  if (key.includes('إيصال')) return <Receipt className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

// Status styling
const getStatusStyles = (status: string) => {
  switch (status) {
    case 'success':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: <CheckCircle className="w-12 h-12 text-emerald-600" />,
        titleColor: 'text-emerald-700 dark:text-emerald-400',
        badgeVariant: 'default' as const,
        title: 'تمت العملية بنجاح'
      };
    case 'pending':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800',
        icon: <Clock className="w-12 h-12 text-amber-600" />,
        titleColor: 'text-amber-700 dark:text-amber-400',
        badgeVariant: 'secondary' as const,
        title: 'قيد المعالجة'
      };
    case 'info':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        border: 'border-blue-200 dark:border-blue-800',
        icon: <AlertTriangle className="w-12 h-12 text-blue-600" />,
        titleColor: 'text-blue-700 dark:text-blue-400',
        badgeVariant: 'outline' as const,
        title: 'معلومات'
      };
    case 'error':
    default:
      return {
        bg: 'bg-red-50 dark:bg-red-950/40',
        border: 'border-red-200 dark:border-red-800',
        icon: <AlertCircle className="w-12 h-12 text-red-600" />,
        titleColor: 'text-red-700 dark:text-red-400',
        badgeVariant: 'destructive' as const,
        title: 'حدث خطأ'
      };
  }
};

export function ServiceResultDisplay({ result, serviceName }: ServiceResultDisplayProps) {
  const styles = getStatusStyles(result.status);

  return (
    <div className={`rounded-xl ${styles.bg} border-2 ${styles.border} overflow-hidden`}>
      {/* Header */}
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-white/80 dark:bg-black/20 flex items-center justify-center shadow-sm">
          {styles.icon}
        </div>
        
        <h3 className={`text-xl font-bold mb-2 ${styles.titleColor}`}>
          {styles.title}
        </h3>
        
        {serviceName && (
          <Badge variant={styles.badgeVariant} className="mb-3">
            {serviceName}
          </Badge>
        )}
        
        <p className="text-foreground font-medium text-base leading-relaxed">
          {result.message}
        </p>
      </div>

      {/* Data Section */}
      {result.data && Object.keys(result.data).length > 0 && (
        <>
          <Separator />
          <div className="p-4 bg-white/50 dark:bg-black/20">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 text-right flex items-center gap-2 justify-end">
              <span>تفاصيل العملية</span>
              <FileText className="w-4 h-4" />
            </h4>
            
            <div className="space-y-2">
              {Object.entries(result.data).map(([key, value]) => {
                // Skip complex objects and arrays
                if (typeof value === 'object' && value !== null) {
                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="bg-muted/30 rounded-lg p-3 text-right">
                        <div className="flex items-center gap-2 justify-end mb-2 text-muted-foreground">
                          <span className="text-sm">{key.replace(/_/g, ' ')}</span>
                          {getFieldIcon(key)}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {value.map((item, idx) => (
                            <li key={idx} className="text-foreground">{String(item)}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                }
                
                const label = key.replace(/_/g, ' ');
                const displayValue = String(value);
                
                return (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-bold text-foreground">{displayValue}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm">{label}</span>
                      {getFieldIcon(key)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      {result.status === 'success' && (
        <div className="p-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            📋 يمكنك متابعة طلبك من صفحة "طلباتي"
          </p>
        </div>
      )}
    </div>
  );
}

// Loading state component
export function ServiceExecutingDisplay() {
  return (
    <div className="py-12 text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
      <h3 className="text-lg font-bold mb-2">جاري تنفيذ الخدمة...</h3>
      <p className="text-muted-foreground text-sm">
        يرجى الانتظار، قد تستغرق العملية بضع ثوانٍ
      </p>
      <div className="flex justify-center gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
