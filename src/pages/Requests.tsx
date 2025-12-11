import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ClipboardList, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ServiceRequest {
  id: string;
  service_type: string;
  service_category: string;
  status: string;
  created_at: string;
  result_data: Record<string, unknown> | null;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
  processing: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-700', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
};

const categoryLabels: Record<string, string> = {
  passports: 'الجوازات',
  traffic: 'المرور',
  civil_affairs: 'الأحوال المدنية',
  visas: 'التأشيرات',
};

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
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
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy - HH:mm', { locale: ar });
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
          <h1 className="text-3xl font-bold text-foreground mb-2">طلباتي</h1>
          <p className="text-muted-foreground">
            تابع حالة طلباتك ومحادثاتك السابقة
          </p>
        </div>

        <Tabs defaultValue="requests" className="animate-slide-up">
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              الطلبات
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              المحادثات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات</h3>
                  <p className="text-muted-foreground">
                    عندما تطلب خدمة من سَنَد، ستظهر هنا لتتبعها
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request, idx) => {
                  const status = statusConfig[request.status] || statusConfig.pending;
                  return (
                    <Card
                      key={request.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">
                              {request.service_type}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {categoryLabels[request.service_category] || request.service_category}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                          <Badge className={`${status.color} gap-1`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
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
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد محادثات</h3>
                  <p className="text-muted-foreground">
                    ابدأ محادثة جديدة مع سَنَد لمساعدتك
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation, idx) => (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer hover:shadow-sanad transition-all animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {conversation.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(conversation.updated_at)}
                          </p>
                        </div>
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
