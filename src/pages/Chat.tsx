import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { QUICK_SUGGESTIONS } from '@/lib/constants';
import { Bot, Sparkles } from 'lucide-react';

export default function Chat() {
  const location = useLocation();
  const { messages, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);

  // Handle initial message from navigation
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    if (initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true;
      sendMessage(initialMessage, 'text');
    }
  }, [location.state, sendMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion, 'text');
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-sanad glow-sanad mb-6">
                  <Bot className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  أهلاً! أنا سَنَد
                </h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  مساعدك الذكي للخدمات الحكومية. اسألني أي سؤال أو اطلب أي خدمة!
                </p>

                {/* Quick Suggestions */}
                <div className="w-full max-w-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">جرّب أحد هذه الأسئلة:</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSuggestion(suggestion)}
                        className="hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="container mx-auto max-w-3xl px-4 pb-4 md:pb-6">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder="اكتب سؤالك أو اطلب خدمة..."
          />
        </div>
      </div>
    </Layout>
  );
}
