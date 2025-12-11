import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, Loader2, Bot, CheckCircle, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, Message } from '@/hooks/useChat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface ServiceContext {
  service?: string;
  serviceId?: string;
  category?: string;
  message?: string;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [serviceContext, setServiceContext] = useState<ServiceContext | null>(null);
  const { messages, isLoading, sendMessage, clearMessages, loadConversation } = useChat();
  
  const { isRecording, startLiveRecognition, stopRecording } = useVoiceInput({
    onTranscript: (text) => {
      setInput(prev => prev + ' ' + text);
    },
  });

  // Listen for openChatWithContext event
  useEffect(() => {
    const handleOpenWithContext = (event: CustomEvent<ServiceContext>) => {
      setServiceContext(event.detail);
      setIsOpen(true);
      if (event.detail.message) {
        setTimeout(() => {
          sendMessage(event.detail.message || '', 'text');
        }, 500);
      }
    };

    const handleOpenWithConversation = (event: CustomEvent<{ conversationId: string }>) => {
      setIsOpen(true);
      loadConversation(event.detail.conversationId);
    };

    window.addEventListener('openChatWithContext', handleOpenWithContext as EventListener);
    window.addEventListener('openChatWithConversation', handleOpenWithConversation as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithContext', handleOpenWithContext as EventListener);
      window.removeEventListener('openChatWithConversation', handleOpenWithConversation as EventListener);
    };
  }, [sendMessage, loadConversation]);

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

  const handleClose = () => {
    setIsOpen(false);
    setServiceContext(null);
  };

  const handleNewChat = () => {
    clearMessages();
    setServiceContext(null);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startLiveRecognition();
    }
  };

  const renderToolCalls = (toolCalls?: { name: string; result: unknown }[]) => {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {toolCalls.map((tool, index) => (
          <div key={index} className="bg-primary/5 rounded-lg p-2 text-xs">
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
              <CheckCircle className="w-3 h-3" />
              <span>تم تنفيذ: {getToolDisplayName(tool.name)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getToolDisplayName = (toolName: string) => {
    const names: Record<string, string> = {
      check_fines: 'استعلام المخالفات',
      pay_fine: 'دفع المخالفة',
      renew_license: 'تجديد الرخصة',
      book_appointment: 'حجز موعد',
      renew_passport: 'تجديد الجواز',
      renew_id: 'تجديد الهوية',
      family_visit_visa: 'تأشيرة زيارة عائلية',
      exit_reentry_visa: 'تأشيرة خروج وعودة',
      search_knowledge: 'البحث في قاعدة المعرفة',
    };
    return names[toolName] || toolName;
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
            <Bot className="w-6 h-6" />
            <span className="absolute inset-0 rounded-full gradient-primary animate-pulse-ring" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="gradient-primary p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="text-xs bg-primary-foreground/20 px-3 py-1 rounded-full hover:bg-primary-foreground/30 transition-colors"
              >
                محادثة جديدة
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-bold text-right">المساعد سَنَد</h3>
                  <p className="text-sm opacity-80 text-right">
                    {serviceContext ? `يساعدك في: ${serviceContext.service}` : 'كيف يمكنني مساعدتك؟'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[350px] p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium mb-2">مرحباً! أنا سَنَد</p>
                <p className="text-sm">مساعدك الذكي للخدمات الحكومية</p>
                <p className="text-xs mt-2 opacity-70">
                  يمكنني تنفيذ الخدمات الحكومية والإجابة عن أسئلتك
                </p>
                
                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <button 
                    onClick={() => sendMessage('استعلم عن مخالفاتي المرورية', 'text')}
                    className="block w-full text-right text-sm bg-muted hover:bg-muted/80 p-3 rounded-xl transition-colors"
                  >
                    🚗 استعلم عن مخالفاتي المرورية
                  </button>
                  <button 
                    onClick={() => sendMessage('أريد تجديد رخصة القيادة', 'text')}
                    className="block w-full text-right text-sm bg-muted hover:bg-muted/80 p-3 rounded-xl transition-colors"
                  >
                    📄 تجديد رخصة القيادة
                  </button>
                  <button 
                    onClick={() => sendMessage('احجز لي موعد في الجوازات', 'text')}
                    className="block w-full text-right text-sm bg-muted hover:bg-muted/80 p-3 rounded-xl transition-colors"
                  >
                    📅 حجز موعد في الجوازات
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[90%]",
                      msg.role === 'user' ? "mr-auto" : "ml-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-2xl text-sm",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && renderToolCalls(msg.toolCalls)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-muted p-3 rounded-2xl rounded-bl-sm max-w-[85%] ml-auto">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">جاري التنفيذ...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant={isRecording ? "destructive" : "ghost"} 
                className={cn(
                  "shrink-0",
                  isRecording 
                    ? "animate-pulse" 
                    : "text-muted-foreground hover:text-primary"
                )}
                onClick={handleVoiceInput}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "جاري الاستماع..." : "اكتب طلبك أو سؤالك..."}
                className="flex-1 bg-card border-0 text-right"
                disabled={isLoading || isRecording}
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