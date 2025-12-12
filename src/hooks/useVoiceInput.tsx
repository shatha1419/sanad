import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startLiveRecognition = useCallback((): Promise<string | null> => {
    return new Promise(async (resolve) => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        
        streamRef.current = stream;
        setIsRecording(true);
        chunksRef.current = [];
        
        // Determine best supported format
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
        
        console.log('Using MIME type:', mimeType);
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          
          if (chunksRef.current.length === 0) {
            setIsRecording(false);
            setIsProcessing(false);
            toast.error('لم يتم تسجيل أي صوت');
            resolve(null);
            return;
          }
          
          setIsProcessing(true);
          toast.info('جاري تحويل الصوت إلى نص...');
          
          try {
            // Create audio blob
            const audioBlob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
            console.log('Audio blob size:', audioBlob.size);
            
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const base64 = (reader.result as string).split(',')[1];
                
                // Send to edge function
                const { data, error } = await supabase.functions.invoke('voice-to-text', {
                  body: { 
                    audio: base64,
                    mimeType: mimeType.split(';')[0]
                  }
                });
                
                setIsProcessing(false);
                setIsRecording(false);
                
                if (error) {
                  console.error('Voice-to-text error:', error);
                  toast.error('فشل تحويل الصوت. حاول مرة أخرى.');
                  onError?.('فشل تحويل الصوت');
                  resolve(null);
                  return;
                }
                
                if (data?.text) {
                  console.log('Transcription:', data.text);
                  toast.success('تم التعرف على الصوت بنجاح');
                  onTranscript?.(data.text);
                  resolve(data.text);
                } else {
                  toast.error('لم يتم التعرف على كلام. حاول مرة أخرى.');
                  resolve(null);
                }
              } catch (err) {
                console.error('Error processing audio:', err);
                setIsProcessing(false);
                setIsRecording(false);
                toast.error('حدث خطأ. حاول مرة أخرى.');
                resolve(null);
              }
            };
            
            reader.onerror = () => {
              setIsProcessing(false);
              setIsRecording(false);
              toast.error('فشل في قراءة الملف الصوتي');
              resolve(null);
            };
            
            reader.readAsDataURL(audioBlob);
            
          } catch (error) {
            console.error('Error processing recording:', error);
            setIsProcessing(false);
            setIsRecording(false);
            toast.error('فشل في معالجة التسجيل');
            resolve(null);
          }
        };
        
        mediaRecorder.start(100); // Collect data every 100ms
        toast.info('🎙️ جاري التسجيل... تحدث الآن، ثم اضغط مرة أخرى للإيقاف', { duration: 3000 });
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            toast.info('تم إيقاف التسجيل تلقائياً (30 ثانية كحد أقصى)');
            mediaRecorderRef.current.stop();
          }
        }, 30000);
        
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
        setIsProcessing(false);
        toast.error('فشل في الوصول للميكروفون. تأكد من إعطاء الإذن.');
        onError?.('فشل في الوصول للميكروفون');
        resolve(null);
      }
    });
  }, [onTranscript, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    isSupported: true,
    startLiveRecognition,
    stopRecording,
  };
}
