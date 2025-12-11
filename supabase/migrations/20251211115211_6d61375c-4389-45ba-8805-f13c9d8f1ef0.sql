
-- Update profiles table with comprehensive user data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date_gregorian DATE,
ADD COLUMN IF NOT EXISTS birth_date_hijri TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'العربية السعودية',
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('أعزب', 'متزوج', 'مطلق', 'أرمل')),
ADD COLUMN IF NOT EXISTS travel_status TEXT DEFAULT 'داخل المملكة',
ADD COLUMN IF NOT EXISTS last_travel_destination TEXT,
ADD COLUMN IF NOT EXISTS last_travel_date DATE,
ADD COLUMN IF NOT EXISTS national_id_expiry TEXT;

-- Family members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  national_id TEXT,
  birth_date DATE,
  is_inside_kingdom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family members" ON public.family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own family members" ON public.family_members
  FOR ALL USING (auth.uid() = user_id);

-- Workers/employees table
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nationality TEXT,
  occupation TEXT,
  visa_number TEXT,
  is_inside_kingdom BOOLEAN DEFAULT true,
  visa_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workers" ON public.workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workers" ON public.workers
  FOR ALL USING (auth.uid() = user_id);

-- Traffic violations table
CREATE TABLE IF NOT EXISTS public.traffic_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_number TEXT UNIQUE NOT NULL,
  violation_type TEXT NOT NULL,
  violation_date DATE NOT NULL,
  location TEXT,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.traffic_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own violations" ON public.traffic_violations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own violations" ON public.traffic_violations
  FOR UPDATE USING (auth.uid() = user_id);

-- Driving licenses table
CREATE TABLE IF NOT EXISTS public.driving_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring_soon', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driving_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own licenses" ON public.driving_licenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own licenses" ON public.driving_licenses
  FOR ALL USING (auth.uid() = user_id);

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  registration_expiry DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring_soon')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own vehicles" ON public.vehicles
  FOR ALL USING (auth.uid() = user_id);

-- Visas table
CREATE TABLE IF NOT EXISTS public.visas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visa_number TEXT UNIQUE NOT NULL,
  visa_type TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  nationality TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visas" ON public.visas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own visas" ON public.visas
  FOR ALL USING (auth.uid() = user_id);

-- Travel history table
CREATE TABLE IF NOT EXISTS public.travel_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  travel_type TEXT CHECK (travel_type IN ('departure', 'arrival')),
  port_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own travel history" ON public.travel_history
  FOR SELECT USING (auth.uid() = user_id);
