import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentResult {
  status: string;
  message: string;
  data?: unknown;
}

export function useAgentAction() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);

  const executeAction = async (toolName: string, args: Record<string, unknown> = {}) => {
    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        setLoading(false);
        return null;
      }

      const { data, error } = await supabase.functions.invoke('sanad-chat', {
        body: {
          action: 'execute_tool',
          tool: toolName,
          args: { ...args, user_id: user.id },
        },
      });

      if (error) throw error;

      const actionResult = data as AgentResult;
      setResult(actionResult);

      if (actionResult.status === 'success') {
        toast.success(actionResult.message);
      } else {
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
