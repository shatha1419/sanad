import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Mic, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSend: (content: string, type: 'text' | 'voice' | 'image', attachments?: { type: string; url: string; name?: string }[]) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading, placeholder = 'اكتب رسالتك هنا...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ type: string; url: string; name?: string; file?: File }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || isLoading) return;

    const messageType = attachments.some(a => a.type.startsWith('image/')) ? 'image' : 'text';
    onSend(message, messageType, attachments.length > 0 ? attachments.map(a => ({ type: a.type, url: a.url, name: a.name })) : undefined);
    setMessage('');
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار صورة فقط',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          type: file.type,
          url: reader.result as string,
          name: file.name,
          file,
        }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          // Send voice message
          onSend(`[رسالة صوتية]`, 'voice', [{
            type: 'audio/webm',
            url: base64,
            name: 'voice-message.webm',
          }]);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'خطأ',
        description: 'لا يمكن الوصول للميكروفون',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment, idx) => (
            <div key={idx} className="relative group">
              {attachment.type.startsWith('image/') ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs">
                  📎
                </div>
              )}
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-2 -left-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0"
        >
          <Image className="w-5 h-5" />
        </Button>

        {/* Voice Recording */}
        <Button
          variant={isRecording ? 'destructive' : 'ghost'}
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
        >
          <Mic className="w-5 h-5" />
        </Button>

        {/* Text Input */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'جاري التسجيل...' : placeholder}
          disabled={isLoading || isRecording}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || isLoading}
          className="flex-shrink-0 gradient-primary text-primary-foreground shadow-sanad"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
