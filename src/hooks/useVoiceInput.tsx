import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onVolumeChange?: (volume: number) => void;
}

// Check if SpeechRecognition is available
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognitionAPI = 
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  
  return SpeechRecognitionAPI || null;
};

export function useVoiceInput({ onTranscript, onError, onVolumeChange }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVolumeMonitor();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const startVolumeMonitor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedVolume = Math.min(average / 128, 1);
        
        setVolume(normalizedVolume);
        onVolumeChange?.(normalizedVolume);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (error) {
      console.error('Error starting volume monitor:', error);
    }
  };

  const stopVolumeMonitor = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVolume(0);
    onVolumeChange?.(0);
  };

  const startLiveRecognition = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const SpeechRecognitionAPI = getSpeechRecognition();
      
      if (!SpeechRecognitionAPI) {
        toast.error('المتصفح لا يدعم التعرف على الصوت. استخدم Chrome أو Edge.');
        onError?.('المتصفح لا يدعم التعرف على الصوت');
        resolve(null);
        return;
      }

      // Stop any existing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      setIsRecording(true);
      startVolumeMonitor();
      
      try {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        let finalTranscript = '';
        let interimTranscript = '';

        recognition.onresult = (event: any) => {
          interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Show interim results immediately
          if (interimTranscript || finalTranscript) {
            const currentText = (finalTranscript + interimTranscript).trim();
            if (currentText) {
              onTranscript?.(currentText);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsProcessing(false);
          stopVolumeMonitor();
          
          if (event.error === 'not-allowed') {
            toast.error('يرجى السماح بالوصول للميكروفون');
          } else if (event.error === 'no-speech') {
            toast.warning('لم يتم اكتشاف صوت. حاول مرة أخرى.');
          } else if (event.error === 'audio-capture') {
            toast.error('لم يتم العثور على ميكروفون');
          } else if (event.error === 'network') {
            toast.error('خطأ في الاتصال بالإنترنت');
          } else if (event.error !== 'aborted') {
            toast.error('حدث خطأ في التعرف على الصوت');
          }
          
          resolve(finalTranscript.trim() || null);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsProcessing(false);
          stopVolumeMonitor();
          
          if (finalTranscript.trim()) {
            toast.success('تم التعرف على الصوت بنجاح');
            resolve(finalTranscript.trim());
          } else {
            resolve(null);
          }
        };

        recognition.start();
        toast.info('🎙️ جاري الاستماع... تحدث الآن', { duration: 2000 });
        
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        stopVolumeMonitor();
        toast.error('فشل في بدء التعرف على الصوت');
        resolve(null);
      }
    });
  }, [onTranscript, onError, onVolumeChange]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
    stopVolumeMonitor();
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    isSupported: getSpeechRecognition() !== null,
    volume,
    startLiveRecognition,
    stopRecording,
  };
}
