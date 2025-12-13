import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Wand2, AlertTriangle, Loader2 } from 'lucide-react';
import { SuggestedFix } from './types';

interface SuggestedFixesProps {
  fixes: SuggestedFix[];
  userActions: string[];
  onApplyFixes: (selectedFixes: string[]) => void;
  onSkip: () => void;
  isApplying: boolean;
}

export function SuggestedFixes({ 
  fixes, 
  userActions, 
  onApplyFixes, 
  onSkip,
  isApplying 
}: SuggestedFixesProps) {
  const [selectedFixes, setSelectedFixes] = useState<string[]>(
    fixes.filter(f => f.auto_fixable).map(f => f.type)
  );

  const autoFixableFixes = fixes.filter(f => f.auto_fixable);
  const hasAutoFixable = autoFixableFixes.length > 0;

  const toggleFix = (type: string) => {
    setSelectedFixes(prev => 
      prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-4">
      {/* Auto-fixable improvements */}
      {hasAutoFixable && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Wand2 className="w-5 h-5" />
              تحسينات تلقائية متاحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              اختر التحسينات التي تريد تطبيقها تلقائياً على صورتك:
            </p>
            <div className="space-y-3">
              {autoFixableFixes.map((fix) => (
                <div
                  key={fix.type}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    id={fix.type}
                    checked={selectedFixes.includes(fix.type)}
                    onCheckedChange={() => toggleFix(fix.type)}
                    disabled={isApplying}
                  />
                  <label htmlFor={fix.type} className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-foreground">{fix.description}</p>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => onApplyFixes(selectedFixes)}
                disabled={selectedFixes.length === 0 || isApplying}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التطبيق...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 ml-2" />
                    تطبيق التحسينات
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onSkip} disabled={isApplying}>
                الاحتفاظ بالأصلية
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User actions required */}
      {userActions.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              إجراءات مطلوبة منك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              هذه المشاكل تحتاج تدخلك المباشر ولا يمكن إصلاحها تلقائياً:
            </p>
            <ul className="space-y-2">
              {userActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
