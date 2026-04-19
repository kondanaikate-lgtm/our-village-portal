CREATE OR REPLACE FUNCTION public.increment_document_download(_doc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documents
  SET download_count = download_count + 1
  WHERE id = _doc_id AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_document_download(uuid) TO anon, authenticated;