import { useState } from 'react';
import { MessageCircle, X, Send, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, Message } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage } = useChat();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message, 'text');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          isOpen 
            ? "bg-foreground text-background rotate-0" 
            : "gradient-primary text-primary-foreground hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full gradient-primary animate-pulse-ring" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="gradient-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <span className="font-bold text-lg">س</span>
              </div>
              <div>
                <h3 className="font-bold">المساعد سَنَد</h3>
                <p className="text-sm opacity-80">كيف يمكنني مساعدتك؟</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[320px] p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground mr-auto rounded-br-sm"
                        : "bg-muted text-foreground ml-auto rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-muted p-3 rounded-2xl rounded-bl-sm max-w-[85%] ml-auto">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground">
                <Mic className="w-5 h-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-card border-0"
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="shrink-0 gradient-primary text-primary-foreground"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
