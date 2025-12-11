import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MessageSquare, Bot, ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messageCount?: number;
  lastMessage?: string;
  status?: 'active' | 'completed' | 'pending';
}

export default function Conversations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    setLoading(true);
    
    const { data: convData, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
      return;
    }

    // Get message counts for each conversation
    const conversationsWithDetails = await Promise.all(
      (convData || []).map(async (conv) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, role')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          messageCount: count || 0,
          lastMessage: lastMsg?.content?.slice(0, 80) || '',
          status: 'active' as const,
        };
      })
    );

    setConversations(conversationsWithDetails);
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy - HH:mm', { locale: ar });
  };

  const openConversation = (conversationId: string) => {
    // Dispatch event to open chat with this conversation
    const event = new CustomEvent('openChatWithConversation', {
      detail: { conversationId }
    });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/requests')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">محادثاتي مع سَنَد</h1>
              <p className="text-muted-foreground">
                تابع وأكمل محادثاتك السابقة مع المساعد الذكي
              </p>
            </div>
          </div>
        </div>

        {/* Agent Info Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1 text-right">
                <h2 className="text-xl font-bold text-foreground mb-2">المساعد سَنَد</h2>
                <p className="text-muted-foreground mb-3">
                  مساعدك الذكي لتنفيذ الخدمات الحكومية والإجابة عن استفساراتك
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    تنفيذ الخدمات
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="w-3 h-3" />
                    الاستفسارات
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    متاح 24/7
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد محادثات</h3>
              <p className="text-muted-foreground mb-6">
                ابدأ محادثة جديدة مع سَنَد للمساعدة في الخدمات الحكومية
              </p>
              <Button 
                className="gradient-primary text-primary-foreground"
                onClick={() => {
                  const event = new CustomEvent('openChatWithContext', {
                    detail: { message: '' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <Bot className="w-4 h-4 ml-2" />
                ابدأ محادثة جديدة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation, idx) => (
              <Card
                key={conversation.id}
                className="cursor-pointer hover:shadow-sanad transition-all animate-slide-up hover:border-primary/30"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => openConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className="shrink-0 text-xs"
                        >
                          {conversation.messageCount} رسالة
                        </Badge>
                        <h3 className="font-semibold text-foreground truncate">
                          {conversation.title}
                        </h3>
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {conversation.lastMessage}...
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDate(conversation.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
