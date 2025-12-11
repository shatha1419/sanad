import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-sanad">
        <Bot className="w-5 h-5" />
      </div>
      <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
