import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

  // Initialize with greeting when dialog opens
  useEffect(() => {
    if (open && service && messages.length === 0) {
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `مرحباً! أنا سَنَد، مساعدك الذكي. سأساعدك في تنفيذ خدمة "${service.name}". 

ما الذي تحتاج مساعدتي فيه؟ يمكنك إخباري بما تريد وسأقوم بتنفيذه لك.`,
      };
      setMessages([greeting]);
    }
  }, [open, service]);

  const handleClose = () => {
    setMessages([]);
    setInput('');
    setConversationId(null);
    onOpenChange(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user || !service) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
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
            title: `${service.name} - محادثة سَنَد`,
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
        content: input,
        message_type: 'text',
      });

      // Build conversation history with service context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      conversationHistory.push({ role: 'user', content: input });

      // Add service context to first message
      const contextMessage = `[سياق الخدمة: المستخدم يريد تنفيذ "${service.name}" من فئة "${category}". ${service.description || ''}]

${input}`;

      const messagesWithContext = [
        ...conversationHistory.slice(0, -1),
        { role: 'user', content: messages.length === 1 ? contextMessage : input }
      ];

      // Call AI
      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          messages: messagesWithContext,
          userId: user.id,
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
          toast.success('تم تنفيذ الخدمة بنجاح! يمكنك متابعتها في صفحة طلباتي');
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
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl text-right flex items-center gap-2 justify-end">
            <span>تنفيذ عبر سَنَد</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          </DialogTitle>
          <DialogDescription className="text-right">
            {service.name}
          </DialogDescription>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] px-1">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'assistant' 
                    ? 'bg-primary/10' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-right'}`}>
                  <div className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] ${
                    message.role === 'assistant' 
                      ? 'bg-muted text-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Tool calls results */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.toolCalls.map((tc, idx) => (
                        <div key={idx} className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-right">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">تم تنفيذ الخدمة</span>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          {tc.result && typeof tc.result === 'object' && 'data' in (tc.result as object) && (
                            <div className="text-xs space-y-1">
                              {Object.entries((tc.result as { data: Record<string, unknown> }).data || {}).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium">{String(value)}</span>
                                  <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">سَنَد يكتب...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t pt-4 mt-auto">
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
              className="shrink-0"
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
              placeholder="اكتب رسالتك هنا..."
              className="text-right"
              disabled={isLoading}
            />
          </form>
          
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setInput(`نفذ خدمة ${service.name}`)}
              disabled={isLoading}
            >
              <Sparkles className="w-3 h-3" />
              تنفيذ الخدمة
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInput('ما هي المتطلبات؟')}
              disabled={isLoading}
            >
              المتطلبات
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInput('كم الرسوم؟')}
              disabled={isLoading}
            >
              الرسوم
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
