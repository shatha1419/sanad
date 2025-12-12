import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentResult {
  status: string;
  message: string;
  data?: unknown;
  fees?: number;
}

interface ExecuteOptions {
  serviceName?: string;
  serviceCategory?: string;
}

export function useAgentAction() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);

  const executeAction = async (
    toolName: string, 
    args: Record<string, unknown> = {},
    options: ExecuteOptions = {}
  ) => {
    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        setLoading(false);
        return null;
      }

      // Clean args - remove serviceId and categoryId as they're not tool parameters
      const cleanArgs = { ...args };
      delete cleanArgs.serviceId;
      delete cleanArgs.categoryId;

      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          action: 'execute_tool',
          tool: toolName,
          args: cleanArgs,
          userId: user.id,
          serviceName: options.serviceName || toolName,
          serviceCategory: options.serviceCategory,
        },
      });

      if (error) throw error;

      const actionResult = data as AgentResult;
      setResult(actionResult);

      if (actionResult.status === 'success') {
        toast.success(actionResult.message);
      } else if (actionResult.status === 'error') {
        toast.error(actionResult.message);
      }

      return actionResult;
    } catch (error) {
      console.error('Agent action error:', error);
      toast.error('حدث خطأ أثناء تنفيذ الإجراء');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { executeAction, loading, result };
}
