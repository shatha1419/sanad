import { Message } from '@/hooks/useChat';
import { User, Bot, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`chat-message flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'gradient-primary text-primary-foreground shadow-sanad'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Card
          className={`px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card rounded-tl-sm'
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {message.attachments.map((attachment, idx) => (
                <div key={idx} className="relative">
                  {attachment.type.startsWith('image/') ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name || 'مرفق'}
                      className="max-w-48 max-h-48 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-muted rounded-lg text-sm">
                      📎 {attachment.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message Text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </Card>

        {/* Tool Calls (Agent Actions) */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {message.toolCalls.map((toolCall, idx) => (
              <Card key={idx} className="px-3 py-2 bg-accent/50 border-accent">
                <div className="flex items-center gap-2 mb-1">
                  <ActionIcon status={(toolCall.result as { status?: string })?.status} />
                  <span className="text-xs font-medium text-accent-foreground">
                    {getToolCallLabel(toolCall.name)}
                  </span>
                </div>
                {toolCall.result && (
                  <div className="text-xs text-muted-foreground">
                    {formatToolResult(toolCall.result)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Message Type Badge */}
        {message.messageType && message.messageType !== 'text' && (
          <Badge variant="outline" className="text-xs">
            {message.messageType === 'voice' ? '🎤 صوتي' : '📷 صورة'}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ActionIcon({ status }: { status?: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-amber-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return <CheckCircle className="w-4 h-4 text-primary" />;
  }
}

function getToolCallLabel(name: string): string {
  const labels: Record<string, string> = {
    check_fines: 'استعلام المخالفات',
    pay_fine: 'دفع مخالفة',
    renew_license: 'تجديد الرخصة',
    book_appointment: 'حجز موعد',
    track_request: 'تتبع الطلب',
    issue_passport: 'إصدار جواز سفر',
    renew_passport: 'تجديد جواز السفر',
    renew_id: 'تجديد الهوية',
    get_requirements: 'استعلام المتطلبات',
    family_visit_visa: 'تأشيرة زيارة عائلية',
    exit_reentry_visa: 'تأشيرة خروج وعودة',
  };
  return labels[name] || name;
}

function formatToolResult(result: unknown): string {
  if (!result) return '';
  
  const res = result as Record<string, unknown>;
  
  if (res.message) return res.message as string;
  if (res.fines) {
    const fines = res.fines as { amount: number; reason: string }[];
    return `عدد المخالفات: ${fines.length}`;
  }
  if (res.appointmentDate) return `الموعد: ${res.appointmentDate}`;
  if (res.requestNumber) return `رقم الطلب: ${res.requestNumber}`;
  
  return JSON.stringify(result);
}
