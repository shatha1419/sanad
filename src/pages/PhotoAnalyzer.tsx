import { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ImageCropper } from '@/components/ImageCropper';
import { ChevronRight, Loader2, X, Crop, Shield, History, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { AgentStep, AnalysisResult } from '@/components/photo-analyzer/types';
import { AgentStepIndicator } from '@/components/photo-analyzer/AgentStepIndicator';
import { ImageUploader } from '@/components/photo-analyzer/ImageUploader';
import { ReasoningTrace } from '@/components/photo-analyzer/ReasoningTrace';
import { AnalysisDetails } from '@/components/photo-analyzer/AnalysisDetails';
import { SuggestedFixes } from '@/components/photo-analyzer/SuggestedFixes';
import { BeforeAfterComparison } from '@/components/photo-analyzer/BeforeAfterComparison';
import { FinalVerdict } from '@/components/photo-analyzer/FinalVerdict';
import { AnalysisHistory } from '@/components/photo-analyzer/AnalysisHistory';
import { BatchAnalysis } from '@/components/photo-analyzer/BatchAnalysis';

export default function PhotoAnalyzer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Image states
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Batch mode
  const [batchImages, setBatchImages] = useState<string[]>([]);
  const [showBatchMode, setShowBatchMode] = useState(false);

  // Agent states
  const [currentStep, setCurrentStep] = useState<AgentStep>('upload');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('analyze');

  const handleImageSelect = useCallback((imageBase64: string) => {
    setOriginalImage(imageBase64);
    setShowCropper(true);
  }, []);

  const handleMultipleImagesSelect = useCallback((images: string[]) => {
    setBatchImages(images);
    setShowBatchMode(true);
  }, []);

  const handleCropComplete = useCallback((croppedImageBase64: string) => {
    setCroppedImage(croppedImageBase64);
    setShowCropper(false);
    analyzeImage(croppedImageBase64);
  }, []);

  const analyzeImage = async (imageBase64: string) => {
    setCurrentStep('analyzing');
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 5, 85));
    }, 200);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: { imageBase64, action: 'analyze' }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;

      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setCurrentStep('reasoning');

        setTimeout(() => {
          if (data.result.verdict === 'APPROVED') {
            setCurrentStep('final');
          } else if (data.result.suggested_fixes?.length > 0) {
            setCurrentStep('decision');
          } else {
            setCurrentStep('final');
          }
        }, 2000);

        toast({
          title: 'اكتمل التحليل',
          description: `نسبة الثقة: ${data.result.overall_confidence}%`,
        });
      } else {
        throw new Error(data.error || 'فشل التحليل');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      toast({
        title: 'خطأ في التحليل',
        description: error.message || 'حدث خطأ أثناء تحليل الصورة',
        variant: 'destructive',
      });
      setCurrentStep('upload');
    }
  };

  const handleApplyFixes = async (selectedFixes: string[]) => {
    if (!croppedImage || selectedFixes.length === 0) return;

    setIsApplyingFixes(true);
    setCurrentStep('applying');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: {
          imageBase64: croppedImage,
          action: 'apply_fixes',
          selectedFixes
        }
      });

      if (error) throw error;

      if (data.success && data.editedImage) {
        setEditedImage(data.editedImage);
        setAppliedFixes(data.appliedFixes || selectedFixes);
        setCurrentStep('comparing');

        setTimeout(async () => {
          await analyzeEditedImage(data.editedImage);
        }, 2000);
      } else {
        throw new Error(data.error || 'فشل تطبيق التحسينات');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في التطبيق',
        description: error.message || 'فشل تطبيق التحسينات',
        variant: 'destructive',
      });
      setCurrentStep('decision');
    } finally {
      setIsApplyingFixes(false);
    }
  };

  const analyzeEditedImage = async (imageBase64: string) => {
    setCurrentStep('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: { imageBase64, action: 'analyze' }
      });

      if (error) throw error;

      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setCroppedImage(imageBase64);
        setCurrentStep('final');

        // Save to database if user is logged in
        if (user) {
          await saveAnalysisToHistory(imageBase64, data.result);
        }
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في إعادة التحليل',
        description: error.message,
        variant: 'destructive',
      });
      setCurrentStep('final');
    }
  };

  const saveAnalysisToHistory = async (imageBase64: string, result: AnalysisResult) => {
    try {
      await supabase.from('photo_analyses').insert({
        user_id: user!.id,
        original_image_url: originalImage,
        edited_image_url: editedImage || null,
        analysis_result: result as any,
        verdict: result.verdict,
        overall_confidence: result.overall_confidence,
      });
    } catch (error) {
      console.error('Failed to save analysis:', error);
    }
  };

  const handleSkipFixes = async () => {
    setCurrentStep('final');
    
    // Save original analysis to history
    if (user && analysisResult && croppedImage) {
      await saveAnalysisToHistory(croppedImage, analysisResult);
    }
  };

  const handleDownload = () => {
    const imageToDownload = editedImage || croppedImage;
    if (!imageToDownload) return;

    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = 'absher-photo.jpg';
    link.click();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setCroppedImage(null);
    setEditedImage(null);
    setAnalysisResult(null);
    setAppliedFixes([]);
    setCurrentStep('upload');
    setAnalysisProgress(0);
    setBatchImages([]);
    setShowBatchMode(false);
  };

  const currentImage = editedImage || croppedImage;

  return (
    <Layout>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <header className="bg-primary text-primary-foreground px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">وكيل التحقق من صور أبشر</h1>
                <p className="text-sm opacity-80">Absher Photo Verification Agent</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 max-w-2xl mx-auto">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyze" className="gap-2">
                <Shield className="w-4 h-4" />
                تحليل صورة
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                السجل
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="space-y-4 mt-4">
              {/* Step Indicator */}
              {currentStep !== 'upload' && !showBatchMode && (
                <AgentStepIndicator currentStep={currentStep} />
              )}

              {/* Image Cropper Modal */}
              {showCropper && originalImage && (
                <ImageCropper
                  imageSrc={originalImage}
                  onCropComplete={handleCropComplete}
                  onCancel={() => {
                    setShowCropper(false);
                    setOriginalImage(null);
                  }}
                />
              )}

              {/* Batch Analysis Mode */}
              {showBatchMode && batchImages.length > 0 && (
                <BatchAnalysis
                  images={batchImages}
                  onComplete={handleReset}
                  onCancel={handleReset}
                />
              )}

              {/* Single Image Flow */}
              {!showBatchMode && (
                <>
                  {/* Step: Upload */}
                  {currentStep === 'upload' && (
                    <ImageUploader 
                      onImageSelect={handleImageSelect}
                      onMultipleImagesSelect={handleMultipleImagesSelect}
                      allowMultiple
                    />
                  )}

                  {/* Step: Analyzing */}
                  {currentStep === 'analyzing' && croppedImage && (
                    <Card className="border-border">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative w-32 h-40 rounded-lg overflow-hidden border-2 border-primary">
                            <img src={croppedImage} alt="الصورة" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                          </div>
                          <div className="w-full max-w-xs">
                            <Progress value={analysisProgress} className="h-2" />
                            <p className="text-center text-sm text-muted-foreground mt-2">
                              جاري التحليل بالذكاء الاصطناعي... {analysisProgress}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step: Reasoning */}
                  {currentStep === 'reasoning' && analysisResult && (
                    <div className="space-y-4">
                      <Card className="border-border">
                        <CardContent className="p-4 flex justify-center">
                          <div className="w-32 h-40 rounded-lg overflow-hidden border border-border">
                            <img src={croppedImage!} alt="الصورة" className="w-full h-full object-cover" />
                          </div>
                        </CardContent>
                      </Card>

                      <ReasoningTrace trace={analysisResult.reasoning_trace} isAnimating />
                      <AnalysisDetails analysis={analysisResult.analysis} />
                    </div>
                  )}

                  {/* Step: Decision */}
                  {currentStep === 'decision' && analysisResult && (
                    <div className="space-y-4">
                      <Card className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-32 rounded-lg overflow-hidden border border-border flex-shrink-0">
                              <img src={croppedImage!} alt="الصورة" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">صورتك الحالية</p>
                              <p className="text-sm text-muted-foreground">
                                نسبة الثقة: {analysisResult.overall_confidence}%
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-8 text-xs"
                                onClick={() => {
                                  if (originalImage) setShowCropper(true);
                                }}
                              >
                                <Crop className="w-3 h-3 ml-1" />
                                إعادة القص
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <SuggestedFixes
                        fixes={analysisResult.suggested_fixes}
                        userActions={analysisResult.user_actions_required}
                        onApplyFixes={handleApplyFixes}
                        onSkip={handleSkipFixes}
                        isApplying={isApplyingFixes}
                      />
                    </div>
                  )}

                  {/* Step: Applying */}
                  {currentStep === 'applying' && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-6 text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">جاري تطبيق التحسينات</h3>
                        <p className="text-sm text-muted-foreground">
                          يتم تحسين صورتك باستخدام الذكاء الاصطناعي...
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step: Comparing */}
                  {currentStep === 'comparing' && croppedImage && editedImage && (
                    <BeforeAfterComparison
                      beforeImage={originalImage || croppedImage}
                      afterImage={editedImage}
                      appliedFixes={appliedFixes}
                    />
                  )}

                  {/* Step: Final */}
                  {currentStep === 'final' && analysisResult && currentImage && (
                    <div className="space-y-4">
                      {editedImage && originalImage && (
                        <BeforeAfterComparison
                          beforeImage={originalImage}
                          afterImage={editedImage}
                          appliedFixes={appliedFixes}
                        />
                      )}

                      <AnalysisDetails analysis={analysisResult.analysis} />

                      <FinalVerdict
                        result={analysisResult}
                        image={currentImage}
                        onDownload={handleDownload}
                        onReset={handleReset}
                      />
                    </div>
                  )}

                  {/* Reset button */}
                  {currentStep !== 'upload' && currentStep !== 'final' && currentStep !== 'analyzing' && currentStep !== 'applying' && (
                    <div className="flex justify-center">
                      <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
                        <X className="w-4 h-4 ml-2" />
                        البدء من جديد
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <AnalysisHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
