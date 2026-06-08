CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE ON public.convites TO authenticated;
GRANT SELECT ON public.convites TO anon;
GRANT ALL ON public.convites TO service_role;

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

-- anon pode ver convites não usados (validação do token)
CREATE POLICY "anon select convites" ON public.convites
  FOR SELECT TO anon
  USING (used_at IS NULL AND expires_at > now());

-- authenticated pode ver todos os convites (admin)
CREATE POLICY "auth select convites" ON public.convites
  FOR SELECT TO authenticated
  USING (true);

-- authenticated pode criar convites (admin)
CREATE POLICY "auth insert convites" ON public.convites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- authenticated pode marcar convite como usado
CREATE POLICY "auth update convites" ON public.convites
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
