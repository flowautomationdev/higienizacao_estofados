ALTER TABLE public.configuracoes_empresa
ADD COLUMN api_rotas TEXT;

COMMENT ON COLUMN public.configuracoes_empresa.api_rotas
IS 'Chave da API OpenRouteService para cálculo de rotas por curva';
