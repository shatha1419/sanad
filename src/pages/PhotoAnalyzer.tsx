import { useState, useRef, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Camera, 
  Check, 
  X, 
  Download, 
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalysisItem {
  passed: boolean;
  percentage: number;
  note: string;
}

interface AnalysisResult {
  whiteBackground: AnalysisItem;
  straightHead: AnalysisItem;
  centeredFace: AnalysisItem;
  faceSize: AnalysisItem;
  goodLighting: AnalysisItem;
  noFilters: AnalysisItem;
  notAiGenerated: AnalysisItem;
  overallScore: number;
  recommendation: string;
}

const requirements = [
  { key: 'whiteBackground', label: 'خلفية بيضاء', description: 'الصورة يجب أن تكون على خلفية بيضاء نقية' },
  { key: 'straightHead', label: 'الرأس مستقيم', description: 'الرأس في وضع مستقيم غير مائل' },
  { key: 'centeredFace', label: 'الوجه في المنتصف', description: 'الوجه يجب أن يكون في منتصف الصورة' },
  { key: 'faceSize', label: 'حجم الوجه مناسب', description: 'حجم الوجه تقريباً 70% من ارتفاع الصورة' },
  { key: 'goodLighting', label: 'إضاءة جيدة', description: 'إضاءة واضحة بدون ظلال على الوجه' },
  { key: 'noFilters', label: 'بدون فلاتر', description: 'الصورة طبيعية بدون فلاتر أو تعديلات' },
  { key: 'notAiGenerated', label: 'صورة حقيقية', description: 'ليست مولدة بالذكاء الاصطناعي' },
];

export default function PhotoAnalyzer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة صالح',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'لا يمكن الوصول للكاميرا',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setImage(canvas.toDataURL('image/jpeg'));
        setAnalysisResult(null);
      }
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: { imageBase64: image }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;

      if (data.success) {
        setAnalysisResult(data.analysis);
        toast({
          title: 'اكتمل التحليل',
          description: `النتيجة الإجمالية: ${data.analysis.overallScore}%`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في التحليل',
        description: error.message || 'حدث خطأ أثناء تحليل الصورة',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = 'absher-photo.jpg';
    link.click();
  };

  const reset = () => {
    setImage(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
  };

  const allPassed = analysisResult && Object.entries(analysisResult)
    .filter(([key]) => requirements.some(r => r.key === key))
    .every(([, value]) => (value as AnalysisItem).passed);

  return (
    <Layout>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <header className="bg-primary text-primary-foreground px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">محلل صور أبشر</h1>
              <p className="text-sm opacity-80">تحقق من مطابقة صورتك لشروط أبشر</p>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Requirements Info */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">شروط الصور المطلوبة</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {requirements.slice(0, 5).map((req) => (
                  <div key={req.key} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Camera Modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
              <video ref={videoRef} className="max-w-full max-h-[60vh] rounded-lg" autoPlay playsInline />
              <div className="flex gap-4 mt-6">
                <Button onClick={capturePhoto} className="bg-primary text-primary-foreground">
                  <Camera className="w-5 h-5 ml-2" />
                  التقاط
                </Button>
                <Button variant="outline" onClick={closeCamera}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* Upload Section */}
          {!image ? (
            <Card 
              className={`bg-card border-2 border-dashed transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">رفع الصورة</h3>
                    <p className="text-sm text-muted-foreground">اسحب وأفلت الصورة هنا أو اختر طريقة الرفع</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      اختيار ملف
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={openCamera}
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      فتح الكاميرا
                    </Button>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={image} 
                    alt="الصورة المرفوعة" 
                    className="w-full max-h-80 object-contain bg-muted"
                  />
                  <button 
                    onClick={reset}
                    className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-2 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {!analysisResult && (
                  <div className="p-4">
                    <Button 
                      onClick={analyzeImage} 
                      disabled={isAnalyzing}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                          جاري التحليل...
                        </>
                      ) : (
                        'تحليل الصورة بالذكاء الاصطناعي'
                      )}
                    </Button>
                    
                    {isAnalyzing && (
                      <div className="mt-4">
                        <Progress value={analysisProgress} className="h-2" />
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          {analysisProgress}% - جاري تحليل الصورة...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Overall Score */}
              <Card className={`border-2 ${allPassed ? 'border-green-500 bg-green-500/5' : 'border-orange-500 bg-orange-500/5'}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-4xl font-bold ${allPassed ? 'text-green-600' : 'text-orange-600'}`}>
                    {analysisResult.overallScore}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">النتيجة الإجمالية</p>
                  <p className={`text-sm mt-2 ${allPassed ? 'text-green-600' : 'text-orange-600'}`}>
                    {analysisResult.recommendation}
                  </p>
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">نتائج التحليل التفصيلية</h3>
                  <div className="space-y-3">
                    {requirements.map((req) => {
                      const result = analysisResult[req.key as keyof AnalysisResult] as AnalysisItem;
                      if (!result) return null;
                      
                      return (
                        <div key={req.key} className="border-b border-border pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {result.passed ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <X className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <span className="font-medium text-foreground">{req.label}</span>
                            </div>
                            <span className={`font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {result.percentage}%
                            </span>
                          </div>
                          <div className="mr-8">
                            <Progress 
                              value={result.percentage} 
                              className={`h-2 ${result.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{result.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {allPassed ? (
                  <Button onClick={downloadImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <Download className="w-5 h-5 ml-2" />
                    تحميل الصورة
                  </Button>
                ) : (
                  <Button onClick={reset} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                    <RotateCcw className="w-5 h-5 ml-2" />
                    إعادة التعديل
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
