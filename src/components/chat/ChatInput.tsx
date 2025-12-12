import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send, Mic, Image, X, Loader2, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { VoiceLevelIndicator } from '@/components/VoiceLevelIndicator';
import { toast as sonnerToast } from 'sonner';

interface ChatInputProps {
  onSend: (content: string, type: 'text' | 'voice' | 'image', attachments?: { type: string; url: string; name?: string }[]) => void;
  isLoading: boolean;
  placeholder?: string;
  lastAssistantMessage?: string;
}

export function ChatInput({ onSend, isLoading, placeholder = 'اكتب رسالتك هنا...', lastAssistantMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ type: string; url: string; name?: string; file?: File }[]>([]);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSpokenRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { isRecording, isProcessing, volume, startLiveRecognition, stopRecording } = useVoiceInput({
    onTranscript: (text) => {
      setMessage(text);
    },
    onVolumeChange: setVoiceVolume,
  });

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!autoSpeak || !ttsSupported || isLoading || !lastAssistantMessage) return;
    
    if (lastAssistantMessage !== lastSpokenRef.current) {
      lastSpokenRef.current = lastAssistantMessage;
      setTimeout(() => {
        speak(lastAssistantMessage);
      }, 300);
    }
  }, [lastAssistantMessage, autoSpeak, ttsSupported, isLoading, speak]);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || isLoading) return;
    stopSpeaking();
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

  const handleVoiceInput = async () => {
    if (isRecording || isProcessing) {
      stopRecording();
    } else {
      stopSpeaking();
      setMessage('');
      await startLiveRecognition();
    }
  };

  const toggleAutoSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setAutoSpeak(!autoSpeak);
    sonnerToast.info(autoSpeak ? 'تم إيقاف النطق التلقائي' : 'تم تفعيل النطق التلقائي');
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      {/* Voice Level Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-3 mb-3 py-3 bg-destructive/10 rounded-xl">
          <VoiceLevelIndicator volume={voiceVolume} isRecording={isRecording} />
          <span className="text-sm text-destructive font-medium">🎙️ جاري الاستماع...</span>
        </div>
      )}

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
        {/* Auto-speak toggle */}
        {ttsSupported && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAutoSpeak}
            className={`flex-shrink-0 ${autoSpeak ? 'text-primary' : 'text-muted-foreground'}`}
            title={autoSpeak ? 'إيقاف النطق التلقائي' : 'تفعيل النطق التلقائي'}
          >
            {autoSpeak ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        )}

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
          onClick={handleVoiceInput}
          disabled={isLoading || isProcessing}
          className={`flex-shrink-0 ${isRecording || isProcessing ? 'animate-pulse' : ''}`}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>

        {/* Text Input */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'تحدث الآن...' : placeholder}
          disabled={isLoading}
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

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-primary">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>سَنَد يتحدث...</span>
          <button onClick={stopSpeaking} className="underline">إيقاف</button>
        </div>
      )}
    </div>
  );
}
