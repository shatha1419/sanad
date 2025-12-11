-- Create agent_usage table to track agent executions
CREATE TABLE public.agent_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  inputs JSONB,
  outputs JSONB,
  status TEXT DEFAULT 'success',
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own agent usage" 
ON public.agent_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent usage" 
ON public.agent_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add some demo traffic violations for testing
INSERT INTO public.traffic_violations (user_id, violation_number, violation_type, amount, violation_date, location, is_paid)
SELECT 
  p.user_id,
  'VIO-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
  (ARRAY['تجاوز السرعة', 'قطع إشارة', 'وقوف خاطئ', 'استخدام الجوال', 'عدم ربط الحزام'])[1 + (RANDOM() * 4)::INT],
  (ARRAY[150, 300, 500, 900, 1000])[1 + (RANDOM() * 4)::INT],
  (CURRENT_DATE - (RANDOM() * 365)::INT)::DATE,
  (ARRAY['الرياض - طريق الملك فهد', 'جدة - شارع التحلية', 'الدمام - طريق الملك سعود', 'مكة - طريق الحرم'])[1 + (RANDOM() * 3)::INT],
  RANDOM() > 0.6
FROM public.profiles p
CROSS JOIN generate_series(1, 3);

-- Add demo driving licenses
INSERT INTO public.driving_licenses (user_id, license_number, license_type, issue_date, expiry_date, status)
SELECT 
  p.user_id,
  'DL-' || LPAD((ROW_NUMBER() OVER())::TEXT, 8, '0'),
  (ARRAY['خاصة', 'عمومية', 'دراجة نارية'])[1 + (RANDOM() * 2)::INT],
  (CURRENT_DATE - (RANDOM() * 1000)::INT)::DATE,
  (CURRENT_DATE + (RANDOM() * 365)::INT)::DATE,
  CASE WHEN RANDOM() > 0.3 THEN 'active' ELSE 'expired' END
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.driving_licenses dl WHERE dl.user_id = p.user_id);

-- Add demo vehicles
INSERT INTO public.vehicles (user_id, plate_number, vehicle_type, brand, model, year, color, registration_expiry, status)
SELECT 
  p.user_id,
  (ARRAY['أ', 'ب', 'ح', 'د', 'ر'])[1 + (RANDOM() * 4)::INT] || ' ' ||
  (ARRAY['س', 'ع', 'ن', 'م', 'ل'])[1 + (RANDOM() * 4)::INT] || ' ' ||
  (ARRAY['ط', 'ك', 'هـ', 'و', 'ي'])[1 + (RANDOM() * 4)::INT] || ' ' ||
  LPAD((1000 + (RANDOM() * 8999)::INT)::TEXT, 4, '0'),
  (ARRAY['سيدان', 'دفع رباعي', 'هاتشباك', 'بيك أب'])[1 + (RANDOM() * 3)::INT],
  (ARRAY['تويوتا', 'هيونداي', 'نيسان', 'شيفروليه', 'فورد'])[1 + (RANDOM() * 4)::INT],
  (ARRAY['كامري', 'النترا', 'التيما', 'ماليبو', 'فيوجن'])[1 + (RANDOM() * 4)::INT],
  2018 + (RANDOM() * 6)::INT,
  (ARRAY['أبيض', 'أسود', 'فضي', 'رمادي', 'أزرق'])[1 + (RANDOM() * 4)::INT],
  (CURRENT_DATE + (RANDOM() * 365)::INT)::DATE,
  CASE WHEN RANDOM() > 0.2 THEN 'active' ELSE 'expired' END
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles v WHERE v.user_id = p.user_id);