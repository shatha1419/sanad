import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ChevronRight } from 'lucide-react';

interface ReasoningTraceProps {
  trace: string[];
  isAnimating?: boolean;
}

export function ReasoningTrace({ trace, isAnimating = false }: ReasoningTraceProps) {
  if (!trace || trace.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          تفكير الوكيل
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trace.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 transition-all duration-500 ${
                isAnimating ? 'animate-fade-in' : ''
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">{step}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
