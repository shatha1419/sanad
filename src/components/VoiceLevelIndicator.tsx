import { cn } from '@/lib/utils';

interface VoiceLevelIndicatorProps {
  volume: number;
  isRecording: boolean;
  className?: string;
}

export function VoiceLevelIndicator({ volume, isRecording, className }: VoiceLevelIndicatorProps) {
  if (!isRecording) return null;

  const bars = 5;
  const activeBarCount = Math.ceil(volume * bars);

  return (
    <div className={cn("flex items-center gap-0.5 h-6", className)}>
      {Array.from({ length: bars }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-75",
            index < activeBarCount
              ? "bg-primary animate-pulse"
              : "bg-muted-foreground/30"
          )}
          style={{
            height: `${Math.max(20, (index + 1) * 20)}%`,
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}
