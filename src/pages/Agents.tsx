import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Bot, 
  CheckCircle, 
  XCircle, 
  Zap,
  ArrowDown,
  ArrowUp,
  Play,
  Info,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentTool {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  category: string;
  isActive: boolean;
  inputs: { name: string; type: string; required: boolean }[];
  outputs: { name: string; type: string }[];
  usageCount: number;
  lastUsed?: string;
}

const AGENT_TOOLS: AgentTool[] = [
  {
    id: 'check_fines',
    name: 'check_fines',
    nameAr: 'استعلام المخالفات المرورية',
    description: 'يستعلم عن المخالفات المرورية المسجلة على المستخدم ويعرض تفاصيلها',
    category: 'traffic',
    isActive: true,
    inputs: [
      { name: 'user_id', type: 'string', required: true },
    ],
    outputs: [
      { name: 'violations', type: 'array' },
      { name: 'total_amount', type: 'number' },
      { name: 'unpaid_count', type: 'number' },
    ],
    usageCount: 0,
  },
  {
    id: 'pay_fine',
    name: 'pay_fine',
    nameAr: 'دفع المخالفة',
    description: 'يقوم بدفع مخالفة مرورية محددة',
    category: 'traffic',
    isActive: true,
    inputs: [
      { name: 'violation_id', type: 'string', required: true },
      { name: 'payment_method', type: 'string', required: true },
    ],
    outputs: [
      { name: 'receipt_number', type: 'string' },
      { name: 'status', type: 'string' },
    ],
    usageCount: 0,
  },
  {
    id: 'renew_license',
    name: 'renew_license',
    nameAr: 'تجديد رخصة القيادة',
    description: 'يقوم بتجديد رخصة القيادة للمستخدم',
    category: 'traffic',
    isActive: true,
    inputs: [
      { name: 'license_id', type: 'string', required: true },
      { name: 'years', type: 'number', required: true },
    ],
    outputs: [
      { name: 'new_expiry_date', type: 'date' },
      { name: 'request_number', type: 'string' },
    ],
    usageCount: 0,
  },
  {
    id: 'book_appointment',
    name: 'book_appointment',
    nameAr: 'حجز موعد',
    description: 'يحجز موعد في أي جهة حكومية',
    category: 'general',
    isActive: true,
    inputs: [
      { name: 'service_type', type: 'string', required: true },
      { name: 'branch_id', type: 'string', required: true },
      { name: 'preferred_date', type: 'date', required: false },
    ],
    outputs: [
      { name: 'appointment_id', type: 'string' },
      { name: 'date', type: 'date' },
      { name: 'time', type: 'string' },
      { name: 'branch_name', type: 'string' },
    ],
    usageCount: 0,
  },
  {
    id: 'renew_passport',
    name: 'renew_passport',
    nameAr: 'تجديد الجواز',
    description: 'يقوم بتجديد جواز السفر السعودي',
    category: 'passports',
    isActive: true,
    inputs: [
      { name: 'passport_number', type: 'string', required: true },
      { name: 'delivery_method', type: 'string', required: true },
    ],
    outputs: [
      { name: 'request_number', type: 'string' },
      { name: 'expected_delivery', type: 'date' },
    ],
    usageCount: 0,
  },
  {
    id: 'renew_id',
    name: 'renew_id',
    nameAr: 'تجديد الهوية الوطنية',
    description: 'يقوم بتجديد بطاقة الهوية الوطنية',
    category: 'civil_affairs',
    isActive: true,
    inputs: [
      { name: 'national_id', type: 'string', required: true },
    ],
    outputs: [
      { name: 'request_number', type: 'string' },
      { name: 'pickup_location', type: 'string' },
    ],
    usageCount: 0,
  },
  {
    id: 'family_visit_visa',
    name: 'family_visit_visa',
    nameAr: 'تأشيرة زيارة عائلية',
    description: 'يقوم بإصدار تأشيرة زيارة عائلية',
    category: 'visas',
    isActive: false,
    inputs: [
      { name: 'visitor_name', type: 'string', required: true },
      { name: 'nationality', type: 'string', required: true },
      { name: 'relationship', type: 'string', required: true },
      { name: 'duration', type: 'number', required: true },
    ],
    outputs: [
      { name: 'visa_number', type: 'string' },
      { name: 'expiry_date', type: 'date' },
    ],
    usageCount: 0,
  },
  {
    id: 'exit_reentry_visa',
    name: 'exit_reentry_visa',
    nameAr: 'تأشيرة خروج وعودة',
    description: 'يقوم بإصدار تأشيرة خروج وعودة للمقيمين',
    category: 'visas',
    isActive: false,
    inputs: [
      { name: 'iqama_number', type: 'string', required: true },
      { name: 'duration', type: 'number', required: true },
      { name: 'type', type: 'string', required: true },
    ],
    outputs: [
      { name: 'visa_number', type: 'string' },
      { name: 'valid_until', type: 'date' },
    ],
    usageCount: 0,
  },
  {
    id: 'search_knowledge',
    name: 'search_knowledge',
    nameAr: 'البحث في قاعدة المعرفة',
    description: 'يبحث في قاعدة المعرفة للإجابة عن الأسئلة',
    category: 'general',
    isActive: true,
    inputs: [
      { name: 'query', type: 'string', required: true },
    ],
    outputs: [
      { name: 'results', type: 'array' },
      { name: 'answer', type: 'string' },
    ],
    usageCount: 0,
  },
];

const categoryLabels: Record<string, string> = {
  traffic: 'المرور',
  passports: 'الجوازات',
  civil_affairs: 'الأحوال المدنية',
  visas: 'التأشيرات',
  general: 'عام',
};

const categoryColors: Record<string, string> = {
  traffic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  passports: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  civil_affairs: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  visas: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function Agents() {
  const navigate = useNavigate();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [agents, setAgents] = useState<AgentTool[]>(AGENT_TOOLS);
  const [loading, setLoading] = useState(true);
  const [totalUsage, setTotalUsage] = useState(0);

  useEffect(() => {
    loadAgentStats();
  }, []);

  const loadAgentStats = async () => {
    setLoading(true);
    
    try {
      // Get usage counts per agent from database
      const { data: usageData, error } = await supabase
        .from('agent_usage')
        .select('agent_id, created_at');

      if (error) {
        console.error('Error loading agent stats:', error);
      } else {
        // Count usage per agent
        const usageCounts: Record<string, number> = {};
        const lastUsed: Record<string, string> = {};
        
        (usageData || []).forEach(usage => {
          usageCounts[usage.agent_id] = (usageCounts[usage.agent_id] || 0) + 1;
          if (!lastUsed[usage.agent_id] || usage.created_at > lastUsed[usage.agent_id]) {
            lastUsed[usage.agent_id] = usage.created_at;
          }
        });

        // Update agents with real stats
        setAgents(prev => prev.map(agent => ({
          ...agent,
          usageCount: usageCounts[agent.id] || 0,
          lastUsed: lastUsed[agent.id],
        })));

        setTotalUsage(usageData?.length || 0);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (filter === 'active') return agent.isActive;
    if (filter === 'inactive') return !agent.isActive;
    return true;
  });

  const activeCount = agents.filter(a => a.isActive).length;
  const inactiveCount = agents.filter(a => !a.isActive).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
              <h1 className="text-3xl font-bold text-foreground">وكلاء سَنَد</h1>
              <p className="text-muted-foreground">
                جميع الأدوات والوكلاء المتاحة للمساعد الذكي
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-foreground">{agents.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الوكلاء</p>
            </CardContent>
          </Card>
          <Card className="text-center border-primary/30">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-primary">{activeCount}</p>
              <p className="text-sm text-muted-foreground">نشط</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-muted-foreground">{inactiveCount}</p>
              <p className="text-sm text-muted-foreground">غير نشط</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-primary">{totalUsage}</p>
              )}
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                إجمالي الاستخدام
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            الكل
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
            className="gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            نشط
          </Button>
          <Button
            variant={filter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('inactive')}
            className="gap-1"
          >
            <XCircle className="w-3 h-3" />
            غير نشط
          </Button>
        </div>

        {/* Agents List */}
        <div className="space-y-4">
          {filteredAgents.map((agent, idx) => (
            <Card
              key={agent.id}
              className={cn(
                "animate-slide-up transition-all cursor-pointer",
                expandedAgent === agent.id && "ring-2 ring-primary"
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    agent.isActive ? "gradient-primary" : "bg-muted"
                  )}>
                    <Bot className={cn(
                      "w-6 h-6",
                      agent.isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Badge className={categoryColors[agent.category]}>
                        {categoryLabels[agent.category]}
                      </Badge>
                      <h3 className="font-bold text-foreground">{agent.nameAr}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {agent.usageCount} استخدام
                      </span>
                      <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                        {agent.name}
                      </code>
                    </div>
                  </div>

                  {/* Status */}
                  <Badge 
                    variant={agent.isActive ? "default" : "secondary"}
                    className={cn(
                      "shrink-0",
                      agent.isActive 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {agent.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1" />
                        نشط
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 ml-1" />
                        غير نشط
                      </>
                    )}
                  </Badge>
                </div>

                {/* Expanded Details */}
                {expandedAgent === agent.id && (
                  <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Inputs */}
                      <div className="bg-muted/50 rounded-xl p-4">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 justify-end">
                          المدخلات (Inputs)
                          <ArrowDown className="w-4 h-4 text-primary" />
                        </h4>
                        <div className="space-y-2">
                          {agent.inputs.map((input, i) => (
                            <div key={i} className="flex items-center justify-between bg-background rounded-lg p-2 text-sm">
                              <Badge variant="outline" className="text-xs">
                                {input.type}
                              </Badge>
                              <div className="flex items-center gap-2">
                                {input.required && (
                                  <span className="text-destructive text-xs">مطلوب</span>
                                )}
                                <code className="font-mono text-xs">{input.name}</code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Outputs */}
                      <div className="bg-muted/50 rounded-xl p-4">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 justify-end">
                          المخرجات (Outputs)
                          <ArrowUp className="w-4 h-4 text-primary" />
                        </h4>
                        <div className="space-y-2">
                          {agent.outputs.map((output, i) => (
                            <div key={i} className="flex items-center justify-between bg-background rounded-lg p-2 text-sm">
                              <Badge variant="outline" className="text-xs">
                                {output.type}
                              </Badge>
                              <code className="font-mono text-xs">{output.name}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const event = new CustomEvent('openChatWithContext', {
                            detail: { message: `اختبر الوكيل: ${agent.nameAr}` }
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        <Play className="w-4 h-4" />
                        تجربة
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-4 h-4" />
                        تفاصيل
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
