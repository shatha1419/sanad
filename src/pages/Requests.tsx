import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Bell,
  Search,
  Filter,
  Trash2,
  X
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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  // Filtered requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.service_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || request.service_category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories from requests
  const uniqueCategories = [...new Set(requests.map(r => r.service_category))];

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || categoryFilter !== 'all';

  const handleClearAllRequests = async () => {
    // Note: This would require DELETE permission on service_requests table
    // For now, we show a message that this feature requires admin access
    toast.error('هذه الميزة غير متاحة حالياً', {
      description: 'لا يمكن حذف الطلبات من قاعدة البيانات'
    });
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy - HH:mm', { locale: ar });
  };

  const openConversation = (conversationId: string) => {
    const event = new CustomEvent('openChatWithConversation', {
      detail: { conversationId }
    });
    window.dispatchEvent(event);
  };

  // Format result data nicely
  const formatResultData = (data: Record<string, unknown>) => {
    return Object.entries(data).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) return null;
      const label = key.replace(/_/g, ' ');
      const icon = key.includes('رقم') ? '📄' : 
                   key.includes('رسوم') ? '💰' : 
                   key.includes('حالة') ? '✅' : 
                   key.includes('تاريخ') ? '📅' :
                   key.includes('اسم') ? '👤' : '📌';
      return (
        <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <span className="font-medium text-sm">{String(value)}</span>
          <span className="text-muted-foreground text-xs">{icon} {label}</span>
        </div>
      );
    }).filter(Boolean);
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
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
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
            {/* Search and Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>البحث والفلترة</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative md:col-span-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث باسم الخدمة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Active filters and actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="gap-1 text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                      مسح الفلاتر
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    عرض {filteredRequests.length} من {requests.length} طلب
                  </span>
                </div>
                
                {requests.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        مسح الكل
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          سيتم حذف جميع الطلبات ({requests.length} طلب). هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleClearAllRequests}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف الكل
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {requests.length === 0 ? 'لا توجد طلبات' : 'لا توجد نتائج'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {requests.length === 0 
                      ? 'عندما تطلب خدمة من سَنَد، ستظهر هنا لتتبعها'
                      : 'جرب تغيير معايير البحث أو الفلترة'
                    }
                  </p>
                  {requests.length === 0 ? (
                    <Button 
                      className="gradient-primary text-primary-foreground"
                      onClick={() => navigate('/services')}
                    >
                      تصفح الخدمات
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request, idx) => {
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div className="text-right">
                                <span className="text-muted-foreground">رقم الطلب:</span>
                                <p className="font-medium font-mono">#{request.id.slice(0, 8)}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">آخر تحديث:</span>
                                <p className="font-medium">{formatDate(request.updated_at)}</p>
                              </div>
                            </div>
                            
                            {request.result_data && Object.keys(request.result_data).length > 0 && (
                              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-right border border-green-200 dark:border-green-800">
                                <p className="text-sm font-semibold mb-3 flex items-center gap-2 justify-end">
                                  <span>نتيجة الطلب</span>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </p>
                                <div className="space-y-1">
                                  {formatResultData(request.result_data)}
                                </div>
                              </div>
                            )}
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