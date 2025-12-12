import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Loader2, 
  ClipboardList, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Eye,
  Bot,
  RefreshCw,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ServiceRequest {
  id: string;
  service_type: string;
  service_category: string;
  status: string;
  created_at: string;
  updated_at: string;
  result_data: Record<string, unknown> | null;
  request_data: Record<string, unknown> | null;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="w-3 h-3" /> },
  processing: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
};

const categoryLabels: Record<string, string> = {
  passports: 'الجوازات',
  traffic: 'المرور',
  civil_affairs: 'الأحوال المدنية',
  visas: 'التأشيرات',
};

const executionTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  auto: { label: 'تنفيذ تلقائي', icon: <CheckCircle className="w-3 h-3" /> },
  agent: { label: 'عبر سَنَد', icon: <Bot className="w-3 h-3" /> },
};

export default function Requests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    const [requestsResult, conversationsResult] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false }),
    ]);

    if (requestsResult.data) setRequests(requestsResult.data as ServiceRequest[]);
    if (conversationsResult.data) setConversations(conversationsResult.data);
    
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Real-time subscription for service_requests
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('service-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as ServiceRequest;
            setRequests(prev => [newRequest, ...prev]);
            toast.success('تم إضافة طلب جديد', {
              description: newRequest.service_type,
              icon: <Bell className="w-4 h-4" />
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as ServiceRequest;
            setRequests(prev => 
              prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
            );
            
            const status = statusConfig[updatedRequest.status];
            toast.info('تم تحديث حالة الطلب', {
              description: `${updatedRequest.service_type}: ${status?.label || updatedRequest.status}`,
              icon: <RefreshCw className="w-4 h-4" />
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setRequests(prev => prev.filter(req => req.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy - HH:mm', { locale: ar });
  };

  const openConversation = (conversationId: string) => {
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
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">طلباتي</h1>
              <p className="text-muted-foreground">
                تابع حالة طلباتك ومحادثاتك السابقة
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="requests" className="animate-slide-up">
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              الطلبات ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              المحادثات ({conversations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات</h3>
                  <p className="text-muted-foreground mb-6">
                    عندما تطلب خدمة من سَنَد، ستظهر هنا لتتبعها
                  </p>
                  <Button 
                    className="gradient-primary text-primary-foreground"
                    onClick={() => navigate('/services')}
                  >
                    تصفح الخدمات
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request, idx) => {
                  const status = statusConfig[request.status] || statusConfig.pending;
                  const execType = executionTypeLabels[(request.request_data as { execution_type?: string })?.execution_type || 'auto'];
                  
                  return (
                    <Card
                      key={request.id}
                      className="animate-slide-up hover:shadow-sanad transition-all cursor-pointer"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Badge className={`${status.color} gap-1`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-xs">
                              {execType.icon}
                              {execType.label}
                            </Badge>
                          </div>
                          <div className="flex-1 text-right">
                            <h3 className="font-semibold text-foreground mb-1">
                              {request.service_type}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {categoryLabels[request.service_category] || request.service_category}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        {selectedRequest?.id === request.id && (
                          <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-right">
                                <span className="text-muted-foreground">رقم الطلب:</span>
                                <p className="font-medium">#{request.id.slice(0, 8)}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">آخر تحديث:</span>
                                <p className="font-medium">{formatDate(request.updated_at)}</p>
                              </div>
                            </div>
                            
                            {request.result_data && (
                              <div className="mt-4 p-3 bg-muted rounded-lg text-right">
                                <p className="text-sm font-medium mb-2">نتيجة الطلب:</p>
                                <pre className="text-xs text-muted-foreground overflow-auto">
                                  {JSON.stringify(request.result_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-4 w-full gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              عرض التفاصيل الكاملة
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversations">
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد محادثات</h3>
                  <p className="text-muted-foreground mb-6">
                    ابدأ محادثة جديدة مع سَنَد لمساعدتك
                  </p>
                  <Button 
                    className="gradient-primary text-primary-foreground gap-2"
                    onClick={() => {
                      const event = new CustomEvent('openChatWithContext', {
                        detail: { message: '' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Bot className="w-4 h-4" />
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
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                          <MessageSquare className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-foreground">
                            {conversation.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatDate(conversation.updated_at)}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}