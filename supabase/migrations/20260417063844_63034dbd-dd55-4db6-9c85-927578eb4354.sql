
-- ============================================
-- 1. ENUMS & UTILITY FUNCTIONS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TYPE public.complaint_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');

CREATE TYPE public.banner_type AS ENUM ('banner', 'popup');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. PROFILES & ROLES
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
CREATE POLICY "Profiles viewable by self and admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies (only admins manage)
CREATE POLICY "Roles viewable by admin" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. AUDIT LOGS
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE POLICY "Audit logs admin only" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated insert audit" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. VILLAGE INFO
-- ============================================

CREATE TABLE public.village_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.village_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Village info public read" ON public.village_info FOR SELECT USING (true);
CREATE POLICY "Village info admin write" ON public.village_info
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_village_info_updated BEFORE UPDATE ON public.village_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. PERSONNEL
-- ============================================

CREATE TABLE public.personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  bio TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_personnel_order ON public.personnel(order_index);

CREATE POLICY "Personnel public read" ON public.personnel
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Personnel admin write" ON public.personnel
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_personnel_updated BEFORE UPDATE ON public.personnel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. NEWS
-- ============================================

CREATE TABLE public.news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News categories public read" ON public.news_categories FOR SELECT USING (true);
CREATE POLICY "News categories admin write" ON public.news_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.news_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_news_published ON public.news(is_published, published_at DESC);
CREATE INDEX idx_news_category ON public.news(category_id);

CREATE POLICY "News public read published" ON public.news
  FOR SELECT USING (
    (is_published = true
      AND (published_at IS NULL OR published_at <= now())
      AND (expired_at IS NULL OR expired_at > now()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "News admin write" ON public.news
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. DOCUMENTS
-- ============================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  fiscal_year INT,
  download_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_year ON public.documents(fiscal_year);

CREATE POLICY "Documents public read" ON public.documents
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Documents admin write" ON public.documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. COMPLAINTS
-- ============================================

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  reporter_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  location TEXT,
  attachment_url TEXT,
  status public.complaint_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_complaints_user ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);

CREATE POLICY "Complaints user read own" ON public.complaints
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Complaints user create own" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Complaints admin update" ON public.complaints
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Complaints admin delete" ON public.complaints
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. OTOP PRODUCTS
-- ============================================

CREATE TABLE public.otop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  unit TEXT,
  image_url TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.otop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OTOP public read" ON public.otop_products
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "OTOP admin write" ON public.otop_products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_otop_updated BEFORE UPDATE ON public.otop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 10. BANNERS
-- ============================================

CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  type public.banner_type NOT NULL DEFAULT 'banner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners public read active" ON public.banners
  FOR SELECT USING (
    (is_active = true
      AND (start_at IS NULL OR start_at <= now())
      AND (end_at IS NULL OR end_at > now()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Banners admin write" ON public.banners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11. SITE VISITORS (stats)
-- ============================================

CREATE TABLE public.site_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  visit_count INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  page_views JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_site_visitors_date ON public.site_visitors(visit_date DESC);

CREATE POLICY "Visitors admin read" ON public.site_visitors
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Public RPC to increment visitor count
CREATE OR REPLACE FUNCTION public.increment_visitor(_page_path TEXT DEFAULT '/')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.site_visitors (visit_date, visit_count, page_views)
  VALUES (CURRENT_DATE, 1, jsonb_build_object(_page_path, 1))
  ON CONFLICT (visit_date) DO UPDATE
  SET visit_count = public.site_visitors.visit_count + 1,
      page_views = public.site_visitors.page_views ||
        jsonb_build_object(
          _page_path,
          COALESCE((public.site_visitors.page_views->>_page_path)::int, 0) + 1
        ),
      updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_visitor(TEXT) TO anon, authenticated;

-- ============================================
-- 12. EVENTS (calendar)
-- ============================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_start ON public.events(start_at);

CREATE POLICY "Events public read" ON public.events
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Events admin write" ON public.events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 13. GALLERY (albums + photos)
-- ============================================

CREATE TABLE public.gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums public read" ON public.gallery_albums
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Albums admin write" ON public.gallery_albums
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_gallery_albums_updated BEFORE UPDATE ON public.gallery_albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_gallery_photos_album ON public.gallery_photos(album_id);

CREATE POLICY "Photos public read" ON public.gallery_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gallery_albums a
      WHERE a.id = album_id
        AND (a.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "Photos admin write" ON public.gallery_photos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 14. SOCIAL LINKS
-- ============================================

CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social links public read" ON public.social_links
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Social links admin write" ON public.social_links
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_social_links_updated BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 15. FAQS
-- ============================================

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQs public read" ON public.faqs
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "FAQs admin write" ON public.faqs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 16. SUBSCRIBERS (newsletter)
-- ============================================

CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  unsubscribe_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers public insert" ON public.subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Subscribers admin read" ON public.subscribers
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Subscribers admin update" ON public.subscribers
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Subscribers admin delete" ON public.subscribers
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Public unsubscribe by token
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _affected INT;
BEGIN
  UPDATE public.subscribers
  SET is_active = false, unsubscribed_at = now()
  WHERE unsubscribe_token = _token AND is_active = true;
  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(TEXT) TO anon, authenticated;

-- ============================================
-- 17. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('news-images', 'news-images', true),
  ('personnel-images', 'personnel-images', true),
  ('documents', 'documents', true),
  ('site-assets', 'site-assets', true),
  ('gallery-photos', 'gallery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
DO $$
DECLARE
  bucket TEXT;
BEGIN
  FOREACH bucket IN ARRAY ARRAY['news-images','personnel-images','documents','site-assets','gallery-photos']
  LOOP
    EXECUTE format($p$
      CREATE POLICY "Public read %1$s" ON storage.objects
        FOR SELECT USING (bucket_id = %2$L);
    $p$, bucket, bucket);
    EXECUTE format($p$
      CREATE POLICY "Admin upload %1$s" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = %2$L AND public.has_role(auth.uid(), 'admin'));
    $p$, bucket, bucket);
    EXECUTE format($p$
      CREATE POLICY "Admin update %1$s" ON storage.objects
        FOR UPDATE USING (bucket_id = %2$L AND public.has_role(auth.uid(), 'admin'));
    $p$, bucket, bucket);
    EXECUTE format($p$
      CREATE POLICY "Admin delete %1$s" ON storage.objects
        FOR DELETE USING (bucket_id = %2$L AND public.has_role(auth.uid(), 'admin'));
    $p$, bucket, bucket);
  END LOOP;
END $$;

-- ============================================
-- 18. SEED DATA
-- ============================================

-- News categories
INSERT INTO public.news_categories (name, slug, description, order_index) VALUES
  ('ข่าวประชาสัมพันธ์', 'announcements', 'ข่าวสารและประกาศทั่วไป', 1),
  ('ข่าวจัดซื้อจัดจ้าง', 'procurement', 'ประกาศจัดซื้อจัดจ้างและสรุปผล', 2),
  ('ข่าวรับสมัครงาน', 'recruitment', 'ประกาศรับสมัครงานและคัดเลือก', 3),
  ('กิจกรรมหมู่บ้าน', 'activities', 'ภาพกิจกรรมและความเคลื่อนไหว', 4)
ON CONFLICT (slug) DO NOTHING;

-- Village info sections
INSERT INTO public.village_info (section_key, title, content) VALUES
  ('history', 'ประวัติความเป็นมา', '<p>หมู่บ้านแซร์ออ หมู่ที่ 2 ตำบลแซร์ออ อำเภอวัฒนานคร จังหวัดสระแก้ว</p>'),
  ('vision', 'วิสัยทัศน์ / พันธกิจ', '<p>มุ่งพัฒนาหมู่บ้านให้น่าอยู่ ประชาชนมีคุณภาพชีวิตที่ดี</p>'),
  ('authority', 'อำนาจหน้าที่', '<p>ดูแลและพัฒนาหมู่บ้านตามอำนาจหน้าที่ที่กฎหมายกำหนด</p>'),
  ('structure', 'โครงสร้างการบริหาร', '<p>คณะกรรมการหมู่บ้านและผู้ช่วยผู้ใหญ่บ้าน</p>'),
  ('location', 'ที่ตั้งและเขตการปกครอง', '<p>หมู่ที่ 2 บ้านแซร์ออ ต.แซร์ออ อ.วัฒนานคร จ.สระแก้ว 27160</p>')
ON CONFLICT (section_key) DO NOTHING;

-- Village headman
INSERT INTO public.personnel (name, position, department, phone, order_index) VALUES
  ('นายสุริยันต์ โฉมยงค์', 'ผู้ใหญ่บ้าน หมู่ที่ 2', 'บ้านแซร์ออ', '0924686927', 1)
ON CONFLICT DO NOTHING;
