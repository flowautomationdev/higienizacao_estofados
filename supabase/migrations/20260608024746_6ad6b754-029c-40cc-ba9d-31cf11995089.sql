
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- update timestamp helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- configuracoes_empresa
CREATE TABLE public.configuracoes_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa TEXT NOT NULL DEFAULT 'Lavô!',
  slogan TEXT DEFAULT 'Seu estofado novo de novo.',
  logo_url TEXT,
  cep_sede TEXT,
  endereco_sede TEXT,
  latitude_sede NUMERIC(10,6),
  longitude_sede NUMERIC(10,6),
  consumo_medio_veiculo NUMERIC(6,2) NOT NULL DEFAULT 10.00,
  preco_combustivel NUMERIC(6,2) NOT NULL DEFAULT 6.50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_empresa TO authenticated;
GRANT ALL ON public.configuracoes_empresa TO service_role;
ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all config" ON public.configuracoes_empresa FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_config_updated BEFORE UPDATE ON public.configuracoes_empresa
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.configuracoes_empresa (nome_empresa, slogan) VALUES ('Lavô!', 'Seu estofado novo de novo.');

-- clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cep TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- servicos
CREATE TYPE public.servico_status AS ENUM ('agendado','em_andamento','concluido','cancelado');
CREATE TYPE public.servico_tipo AS ENUM ('sofa','colchao','poltrona','tapete','banco_automotivo','outro');

CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_servico public.servico_tipo NOT NULL DEFAULT 'sofa',
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.servico_status NOT NULL DEFAULT 'agendado',
  data_agendada TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT,
  cep TEXT,
  endereco TEXT,
  origem_lat NUMERIC(10,6),
  origem_lng NUMERIC(10,6),
  destino_lat NUMERIC(10,6),
  destino_lng NUMERIC(10,6),
  distancia_km NUMERIC(10,2) DEFAULT 0,
  litros_estimados NUMERIC(10,2) DEFAULT 0,
  custo_combustivel NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all servicos" ON public.servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_servicos_updated BEFORE UPDATE ON public.servicos
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- regras_financeiras
CREATE TABLE public.regras_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_financeiras TO authenticated;
GRANT ALL ON public.regras_financeiras TO service_role;
ALTER TABLE public.regras_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all regras" ON public.regras_financeiras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_regras_updated BEFORE UPDATE ON public.regras_financeiras
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.regras_financeiras (nome, percentual, ativo, ordem) VALUES
('Produtos', 8, true, 1),
('Veículo', 5, true, 2),
('Equipamentos', 5, true, 3),
('Marketing', 5, true, 4),
('Expansão', 5, true, 5);

-- movimentacoes (snapshot por serviço)
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes TO authenticated;
GRANT ALL ON public.movimentacoes TO service_role;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all mov" ON public.movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
