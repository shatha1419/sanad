-- Create table for photo analysis history
CREATE TABLE public.photo_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_image_url TEXT,
  edited_image_url TEXT,
  analysis_result JSONB NOT NULL,
  verdict TEXT NOT NULL,
  overall_confidence INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
CREATE POLICY "Users can view own photo analyses" 
ON public.photo_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own analyses
CREATE POLICY "Users can create own photo analyses" 
ON public.photo_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own photo analyses" 
ON public.photo_analyses 
FOR DELETE 
USING (auth.uid() = user_id);