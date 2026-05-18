-- Departments table for ordering
CREATE TABLE IF NOT EXISTS public.personnel_departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.personnel_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments public read"
ON public.personnel_departments FOR SELECT
USING (true);

CREATE POLICY "Departments admin write"
ON public.personnel_departments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_personnel_departments_updated_at
BEFORE UPDATE ON public.personnel_departments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Site setting for image shape
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS personnel_image_shape text NOT NULL DEFAULT 'circle';