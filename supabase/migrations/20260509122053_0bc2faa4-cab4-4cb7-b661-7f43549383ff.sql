
-- ITA OIT indicators table (admin-editable)
CREATE TABLE IF NOT EXISTS public.ita_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.ita_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ITA indicators public read"
  ON public.ita_indicators FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ITA indicators admin write"
  ON public.ita_indicators FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_ita_indicators_updated_at
  BEFORE UPDATE ON public.ita_indicators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default 10 OIT indicators
INSERT INTO public.ita_indicators (code, title, description, order_index) VALUES
  ('O1', 'โครงสร้างองค์กร', 'แสดงโครงสร้างการบริหารและการจัดส่วนงาน', 10),
  ('O2', 'ข้อมูลผู้บริหาร', 'ข้อมูลผู้บริหารและตำแหน่งสำคัญ', 20),
  ('O3', 'อำนาจหน้าที่', 'ภารกิจ อำนาจหน้าที่ตามกฎหมาย', 30),
  ('O4', 'แผนยุทธศาสตร์/แผนพัฒนา', 'แผนพัฒนาท้องถิ่น/แผนยุทธศาสตร์', 40),
  ('O5', 'ข้อมูลการติดต่อ', 'ที่อยู่ เบอร์โทร อีเมล แผนที่', 50),
  ('O6', 'กฎหมายที่เกี่ยวข้อง', 'ระเบียบ กฎหมายที่ใช้ปฏิบัติงาน', 60),
  ('O7', 'ข่าวประชาสัมพันธ์', 'ข่าวสารที่เผยแพร่ต่อสาธารณะ', 70),
  ('O8', 'Q&A', 'ช่องทางการถาม-ตอบ', 80),
  ('O9', 'Social Network', 'ช่องทางการสื่อสารออนไลน์', 90),
  ('O10', 'นโยบายคุ้มครองข้อมูลส่วนบุคคล', 'PDPA และนโยบายเว็บไซต์', 100)
ON CONFLICT DO NOTHING;

-- Layout settings for About / Footer / Contact
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS footer_columns INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS footer_align TEXT NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS footer_show_quicklinks BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_headman BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_social BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_layout TEXT NOT NULL DEFAULT 'two-column',
  ADD COLUMN IF NOT EXISTS contact_map_position TEXT NOT NULL DEFAULT 'right',
  ADD COLUMN IF NOT EXISTS about_align TEXT NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS about_hero_style TEXT NOT NULL DEFAULT 'gradient';
