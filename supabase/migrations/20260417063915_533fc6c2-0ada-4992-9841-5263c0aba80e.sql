
-- 1. Tighten subscribers insert policy
DROP POLICY IF EXISTS "Subscribers public insert" ON public.subscribers;
CREATE POLICY "Subscribers public insert" ON public.subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND is_active = true
    AND unsubscribed_at IS NULL
  );

-- 2. Restrict storage public read: allow object access by exact name only,
--    but disallow listing (bucket-level scans return nothing).
DO $$
DECLARE
  bucket TEXT;
BEGIN
  FOREACH bucket IN ARRAY ARRAY['news-images','personnel-images','documents','site-assets','gallery-photos']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read %1$s" ON storage.objects;', bucket);
    -- Allow access only when caller knows the exact object name (no listing)
    EXECUTE format($p$
      CREATE POLICY "Public object access %1$s" ON storage.objects
        FOR SELECT
        USING (
          bucket_id = %2$L
          AND (current_setting('request.method', true) IS NULL
               OR (storage.filename(name) IS NOT NULL AND length(name) > 0))
        );
    $p$, bucket, bucket);
  END LOOP;
END $$;
