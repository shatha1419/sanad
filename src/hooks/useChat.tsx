import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  messageType?: 'text' | 'voice' | 'image';
  attachments?: { type: string; url: string; name?: string }[];
  toolCalls?: { name: string; result: unknown }[];
  createdAt: Date;
}

interface UseChatOptions {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

export function useChat({ conversationId, onConversationCreated }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const { toast } = useToast();

  const createConversation = useCallback(async (title?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: title || 'محادثة جديدة' })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setCurrentConversationId(data.id);
    onConversationCreated?.(data.id);
    return data.id;
  }, [onConversationCreated]);

  const saveMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    messageType: 'text' | 'voice' | 'image' = 'text',
    attachments?: unknown,
    toolCalls?: unknown
  ) => {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        message_type: messageType,
        attachments: attachments as never,
        tool_calls: toolCalls as never,
      });

    if (error) {
      console.error('Error saving message:', error);
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'voice' | 'image' = 'text',
    attachments?: { type: string; url: string; name?: string }[]
  ) => {
    if (!content.trim() && !attachments?.length) return;

    // Get or create conversation
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation(content.slice(0, 50));
      if (!convId) {
        toast({
          title: 'خطأ',
          description: 'فشل في إنشاء المحادثة',
          variant: 'destructive',
        });
        return;
      }
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      messageType,
      attachments,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save user message
      await saveMessage(convId, 'user', content, messageType, attachments);

      // Prepare messages for AI
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Get current user for saving requests
      const { data: { user } } = await supabase.auth.getUser();

      // Call AI edge function with userId for saving requests
      const response = await supabase.functions.invoke('sanad-chat', {
        body: {
          messages: conversationHistory,
          attachments,
          userId: user?.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiResponse = response.data;
      
      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse.content,
        toolCalls: aiResponse.toolCalls,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await saveMessage(convId, 'assistant', aiResponse.content, 'text', undefined, aiResponse.toolCalls);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle rate limiting
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('rate')) {
          toast({
            title: 'تم تجاوز الحد المسموح',
            description: 'الرجاء الانتظار قليلاً ثم المحاولة مرة أخرى',
            variant: 'destructive',
          });
        } else if (error.message.includes('402')) {
          toast({
            title: 'نفاد الرصيد',
            description: 'الرجاء شحن الرصيد للاستمرار في استخدام الخدمة',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'خطأ',
            description: 'حدث خطأ أثناء معالجة طلبك',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, messages, createConversation, saveMessage, toast]);

  const loadConversation = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const loadedMessages: Message[] = data.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      messageType: m.message_type as 'text' | 'voice' | 'image',
      attachments: m.attachments as Message['attachments'],
      toolCalls: m.tool_calls as Message['toolCalls'],
      createdAt: new Date(m.created_at),
    }));

    setMessages(loadedMessages);
    setCurrentConversationId(convId);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(undefined);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    loadConversation,
    clearMessages,
    currentConversationId,
  };
}
