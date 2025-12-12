import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ServiceItem } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Loader2,
  Send,
  Bot,
  User,
  CheckCircle,
  Sparkles,
  FileText,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

interface AgentExecutionDialogProps {
  service: ServiceItem | null;
  category: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { name: string; result: unknown }[];
}

export function AgentExecutionDialog({
  service,
  category,
  open,
  onOpenChange,
}: AgentExecutionDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting when dialog opens
  useEffect(() => {
    if (open && service && messages.length === 0) {
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `مرحباً! أنا سَنَد 👋

سأساعدك في خدمة "${service.name}".

${service.fees ? `💰 الرسوم: ${service.fees}` : ''}
${service.conditions?.length ? `\n📋 الشروط:\n${service.conditions.map(c => `• ${c}`).join('\n')}` : ''}

كيف أساعدك؟ يمكنك:
• طلب تنفيذ الخدمة
• الاستفسار عن المتطلبات
• السؤال عن الرسوم`,
      };
      setMessages([greeting]);
    }
  }, [open, service]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = () => {
    setMessages([]);
    setInput('');
    setConversationId(null);
    onOpenChange(false);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading || !user || !service) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create conversation if not exists
      let convId = conversationId;
      if (!convId) {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: `${service.name} - سَنَد`,
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = convData.id;
        setConversationId(convId);
      }

      // Save user message
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'user',
        content: textToSend,
        message_type: 'text',
      });

      // Build conversation history with service context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      conversationHistory.push({ role: 'user', content: textToSend });

      // Add service context to first user message
      const contextMessage = `[سياق: خدمة "${service.name}" - فئة "${category}". الرسوم: ${service.fees || 'غير محددة'}. الشروط: ${service.conditions?.join('، ') || 'لا يوجد'}]

${textToSend}`;

      const messagesWithContext = [
        ...conversationHistory.slice(0, -1),
        { role: 'user', content: messages.length === 1 ? contextMessage : textToSend }
      ];

      // Call AI
      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          messages: messagesWithContext,
          userId: user.id,
          serviceCategory: category,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        toolCalls: data.toolCalls,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: data.content,
        message_type: 'text',
        tool_calls: data.toolCalls || null,
      });

      // Show success toast if tool was executed
      if (data.toolCalls && data.toolCalls.length > 0) {
        const hasSuccess = data.toolCalls.some((tc: { result: { status: string } }) => tc.result?.status === 'success');
        if (hasSuccess) {
          toast.success('تم تنفيذ الخدمة بنجاح!', {
            description: 'يمكنك متابعتها في صفحة طلباتي',
            action: {
              label: 'عرض الطلبات',
              onClick: () => window.location.href = '/requests',
            },
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('حدث خطأ أثناء إرسال الرسالة');
    } finally {
      setIsLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b bg-gradient-to-l from-primary/5 to-transparent">
          <DialogTitle className="text-lg text-right flex items-center gap-3 justify-end">
            <div className="flex flex-col items-end">
              <span className="font-bold">سَنَد</span>
              <span className="text-xs font-normal text-muted-foreground">{service.name}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-[350px] max-h-[450px]" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'assistant' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`inline-block rounded-2xl px-4 py-3 ${
                    message.role === 'assistant' 
                      ? 'bg-muted text-foreground rounded-tr-sm' 
                      : 'bg-primary text-primary-foreground rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-right">{message.content}</p>
                  </div>
                  
                  {/* Tool calls results */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolCalls.map((tc, idx) => (
                        <div key={idx} className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-right">
                          <div className="flex items-center gap-2 justify-end mb-3">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">تم تنفيذ الخدمة بنجاح</span>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          {tc.result && typeof tc.result === 'object' && 'data' in (tc.result as object) && (
                            <div className="text-sm space-y-2 bg-white/50 dark:bg-black/20 rounded-lg p-3">
                              {Object.entries((tc.result as { data: Record<string, unknown> }).data || {}).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center border-b border-green-100 dark:border-green-900 pb-1 last:border-0 last:pb-0">
                                  <span className="font-medium text-green-800 dark:text-green-300">{String(value)}</span>
                                  <span className="text-green-600 dark:text-green-500 text-xs">{key.replace(/_/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-tr-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-background">
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mb-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8 rounded-full"
              onClick={() => sendMessage(`نفذ خدمة ${service.name}`)}
              disabled={isLoading}
            >
              <Sparkles className="w-3 h-3" />
              تنفيذ الخدمة
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8 rounded-full"
              onClick={() => sendMessage('ما هي المتطلبات؟')}
              disabled={isLoading}
            >
              <FileText className="w-3 h-3" />
              المتطلبات
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8 rounded-full"
              onClick={() => sendMessage('كم الرسوم؟')}
              disabled={isLoading}
            >
              <CreditCard className="w-3 h-3" />
              الرسوم
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8 rounded-full"
              onClick={() => sendMessage('كيف أصل للخدمة؟')}
              disabled={isLoading}
            >
              <HelpCircle className="w-3 h-3" />
              طريقة الوصول
            </Button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0 rounded-full w-10 h-10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="text-right rounded-full px-4"
              disabled={isLoading}
            />
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
