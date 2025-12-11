
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  national_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'محادثة جديدة',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image')),
  attachments JSONB,
  tool_calls JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_requests table for tracking agent actions
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN ('passports', 'traffic', 'civil_affairs', 'visas')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  request_data JSONB,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_base table for RAG
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('passports', 'traffic', 'civil_affairs', 'visas', 'general')),
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Service requests policies
CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own service requests" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service requests" ON public.service_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Knowledge base is readable by all authenticated users
CREATE POLICY "Authenticated users can read knowledge base" ON public.knowledge_base
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample knowledge base data
INSERT INTO public.knowledge_base (title, content, category, keywords) VALUES
('تجديد جواز السفر', 'لتجديد جواز السفر، يجب عليك:
1. الدخول على منصة أبشر
2. اختيار خدمات الجوازات
3. تجديد جواز السفر
4. دفع الرسوم (300 ريال لـ 5 سنوات أو 600 ريال لـ 10 سنوات)
5. استلام الجواز من أقرب مكتب بريد', 'passports', ARRAY['جواز', 'تجديد', 'جوازات', 'سفر']),

('إصدار جواز سفر جديد', 'لإصدار جواز سفر لأول مرة:
1. حجز موعد في الجوازات عبر أبشر
2. إحضار الهوية الوطنية الأصلية
3. صور شخصية بخلفية بيضاء
4. دفع الرسوم المطلوبة
5. الحضور للموعد في مكتب الجوازات', 'passports', ARRAY['جواز', 'إصدار', 'جديد', 'أول مرة']),

('استعلام المخالفات المرورية', 'للاستعلام عن المخالفات المرورية:
1. الدخول على منصة أبشر أو تطبيق أبشر
2. اختيار خدمات المرور
3. الاستعلام عن المخالفات
4. ستظهر قائمة بجميع المخالفات وتفاصيلها
يمكنك أيضاً الاعتراض على أي مخالفة خلال 30 يوم', 'traffic', ARRAY['مخالفة', 'مخالفات', 'مرور', 'سيارة', 'استعلام']),

('تجديد رخصة القيادة', 'لتجديد رخصة القيادة:
1. التأكد من صلاحية الفحص الطبي
2. الدخول على أبشر
3. اختيار تجديد الرخصة
4. دفع الرسوم (80 ريال لـ 5 سنوات أو 160 ريال لـ 10 سنوات)
5. استلام الرخصة الجديدة', 'traffic', ARRAY['رخصة', 'قيادة', 'تجديد', 'سواقة']),

('تجديد الهوية الوطنية', 'لتجديد الهوية الوطنية:
1. الدخول على أبشر
2. اختيار خدمات الأحوال المدنية
3. تجديد الهوية الوطنية
4. دفع الرسوم (100 ريال)
5. اختيار العنوان الوطني لتوصيل الهوية أو استلامها من مكتب الأحوال', 'civil_affairs', ARRAY['هوية', 'وطنية', 'تجديد', 'أحوال']),

('شهادة الميلاد', 'للحصول على شهادة ميلاد:
1. يجب تسجيل المولود خلال 15 يوم من الولادة
2. التوجه لمكتب الأحوال المدنية
3. إحضار شهادة الميلاد من المستشفى
4. إحضار هوية الأب والأم
5. تعبئة نموذج التسجيل', 'civil_affairs', ARRAY['ميلاد', 'شهادة', 'مولود', 'تسجيل']),

('تأشيرة زيارة عائلية', 'لإصدار تأشيرة زيارة عائلية:
1. الدخول على منصة مقيم
2. اختيار طلب تأشيرة زيارة
3. تحديد درجة القرابة
4. إرفاق المستندات المطلوبة
5. دفع الرسوم (300 ريال للشهر الواحد)
مدة التأشيرة من شهر إلى سنة', 'visas', ARRAY['تأشيرة', 'زيارة', 'عائلية', 'عائلة', 'قريب']),

('تأشيرة خروج وعودة', 'لإصدار تأشيرة خروج وعودة:
1. الدخول على أبشر أو مقيم
2. اختيار تأشيرات
3. إصدار تأشيرة خروج وعودة
4. تحديد المدة (مفردة أو متعددة)
5. دفع الرسوم
الرسوم: مفردة 200 ريال، متعددة 500 ريال لمدة 6 أشهر', 'visas', ARRAY['خروج', 'عودة', 'تأشيرة', 'سفر', 'مقيم']);
