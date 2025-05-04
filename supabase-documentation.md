# Documentação do Supabase - Sistema de Gestão Eclesiástica

## Índice
1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Schemas e Tabelas](#schemas-e-tabelas)
5. [Políticas de Segurança (RLS)](#políticas-de-segurança-rls)
6. [Funções e Triggers](#funções-e-triggers)
7. [Autenticação e Autorização](#autenticação-e-autorização)
8. [Buckets de Armazenamento](#buckets-de-armazenamento)
9. [API e Consultas Frequentes](#api-e-consultas-frequentes)
10. [Backups e Restauração](#backups-e-restauração)

## Visão Geral

O Supabase serve como backend completo para o sistema de gestão eclesiástica, fornecendo:
- Banco de dados PostgreSQL para armazenamento de dados
- Sistema de autenticação e controle de acesso
- Row Level Security (RLS) para proteção de dados
- Armazenamento para upload de arquivos (fotos de membros)
- Funções serverless para lógica de negócio complexa
- API RESTful e realtime para comunicação com o frontend

## Configuração Inicial

### Criação do Projeto

1. Acesse o [dashboard do Supabase](https://app.supabase.com)
2. Crie um novo projeto com as seguintes configurações:
   - **Nome**: Igreja Digital
   - **Região**: Escolha a mais próxima dos usuários finais
   - **Database Password**: Defina uma senha segura
   - **Plano**: Escolha o plano adequado às necessidades da igreja

### Configuração do Cliente

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function para o lado do servidor com autenticação administrativa
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      }
    }
  );
};
```

## Estrutura do Banco de Dados

### Diagrama ER

```
membros (1) --- (N) escala_louvor (N) --- (1) louvor (N) --- (1) cultos
  |
  |
  +---- (1) ensino (N) (como professor)
         |
  +---- (1) cultos (N) (como dirigente)
         |
  +---- (1) cultos (N) (como pregador)
```

## Schemas e Tabelas

### Schema Público

```sql
-- Inicialização do UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tabela: `profiles`

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cargo TEXT,
  admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger para criar profile automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Tabela: `membros`

```sql
CREATE TABLE membros (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  data_nascimento DATE,
  endereco TEXT,
  funcao TEXT[], -- pastor, diácono, membro, etc.
  habilidades TEXT[], -- instrumentos, canto, ensino, etc.
  disponibilidade JSONB, -- dias da semana disponíveis
  foto_url TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

-- Trigger para atualizar o campo "updated_at" automaticamente
CREATE TRIGGER update_membros_timestamp
BEFORE UPDATE ON membros
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `ensino`

```sql
CREATE TABLE ensino (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data DATE NOT NULL,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL, -- EBD, discipulado, etc.
  classe TEXT NOT NULL, -- adultos, jovens, adolescentes, etc.
  professor_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  descricao TEXT,
  material_url TEXT,
  concluido BOOLEAN DEFAULT FALSE,
  participantes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

CREATE TRIGGER update_ensino_timestamp
BEFORE UPDATE ON ensino
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `cultos`

```sql
CREATE TABLE cultos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  dia TEXT NOT NULL, -- dia da semana
  tipo TEXT NOT NULL, -- Santa Ceia, Celebração, Missões, etc.
  ministerio TEXT NOT NULL, -- pastoral, missões, família, etc.
  dirigente_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  pregador_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  tema TEXT,
  texto_biblico TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'planejado', -- planejado, confirmado, realizado, cancelado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

CREATE TRIGGER update_cultos_timestamp
BEFORE UPDATE ON cultos
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `louvor`

```sql
CREATE TABLE louvor (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  culto_id UUID REFERENCES cultos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  evento TEXT NOT NULL, -- Santa Ceia, Celebração, etc.
  responsavel_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

CREATE TRIGGER update_louvor_timestamp
BEFORE UPDATE ON louvor
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `escala_louvor`

```sql
CREATE TABLE escala_louvor (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  louvor_id UUID REFERENCES louvor(id) ON DELETE CASCADE,
  membro_id UUID REFERENCES membros(id) ON DELETE CASCADE,
  funcao TEXT NOT NULL, -- bateria, teclado, baixo, guitarra, etc.
  tipo TEXT NOT NULL, -- back, ministro, fotografia, etc.
  confirmacao BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

CREATE TRIGGER update_escala_louvor_timestamp
BEFORE UPDATE ON escala_louvor
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `repertorio`

```sql
CREATE TABLE repertorio (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  louvor_id UUID REFERENCES louvor(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  artista TEXT,
  tom TEXT,
  bpm INTEGER,
  duracao TEXT, -- formato MM:SS 
  link_audio TEXT,
  link_cifra TEXT,
  link_letra TEXT,
  ordem INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

CREATE TRIGGER update_repertorio_timestamp
BEFORE UPDATE ON repertorio
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `presenca_ensino`

```sql
CREATE TABLE presenca_ensino (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ensino_id UUID REFERENCES ensino(id) ON DELETE CASCADE,
  membro_id UUID REFERENCES membros(id) ON DELETE CASCADE,
  presente BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users,
  UNIQUE(ensino_id, membro_id)
);

CREATE TRIGGER update_presenca_ensino_timestamp
BEFORE UPDATE ON presenca_ensino
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Tabela: `eventos`

```sql
CREATE TABLE eventos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  tipo TEXT NOT NULL, -- reunião, retiro, conferência, etc.
  responsavel_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'planejado', -- planejado, confirmado, realizado, cancelado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

CREATE TRIGGER update_eventos_timestamp
BEFORE UPDATE ON eventos
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
```

### Procedimento para atualização de timestamps

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Políticas de Segurança (RLS)

### Configurações Globais

```sql
-- Ativar RLS em todas as tabelas principais
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ensino ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultos ENABLE ROW LEVEL SECURITY;
ALTER TABLE louvor ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_louvor ENABLE ROW LEVEL SECURITY;
ALTER TABLE repertorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenca_ensino ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
```

### Função Helper para Verificar Administradores

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Políticas para `profiles`

```sql
-- Usuários autenticados podem ver todos os perfis (informações básicas)
CREATE POLICY "Usuários autenticados podem ver perfis" 
ON profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Usuários podem editar apenas seu próprio perfil
CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Apenas administradores podem alterar status de admin
CREATE POLICY "Apenas admins podem alterar status admin" 
ON profiles FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());
```

### Políticas para `membros`

```sql
-- Usuários autenticados podem ver todos os membros
CREATE POLICY "Usuários autenticados podem ver membros" 
ON membros FOR SELECT 
USING (auth.role() = 'authenticated');

-- Apenas admins e líderes de ministérios podem inserir membros
CREATE POLICY "Apenas admins e líderes podem inserir membros" 
ON membros FOR INSERT 
WITH CHECK (is_admin() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND cargo IN ('pastor', 'líder')
));

-- Apenas admins e líderes de ministérios podem atualizar membros
CREATE POLICY "Apenas admins e líderes podem atualizar membros" 
ON membros FOR UPDATE 
USING (is_admin() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND cargo IN ('pastor', 'líder')
));

-- Apenas admins podem excluir membros
CREATE POLICY "Apenas admins podem excluir membros" 
ON membros FOR DELETE 
USING (is_admin());
```

### Políticas para `ensino`

```sql
-- Usuários autenticados podem ver aulas de ensino
CREATE POLICY "Usuários autenticados podem ver ensino" 
ON ensino FOR SELECT 
USING (auth.role() = 'authenticated');

-- Admins e líderes educacionais podem inserir aulas
CREATE POLICY "Admins e líderes educacionais podem inserir ensino" 
ON ensino FOR INSERT 
WITH CHECK (is_admin() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND cargo IN ('pastor', 'líder', 'professor')
));

-- Admins, líderes educacionais e o próprio professor podem atualizar aulas
CREATE POLICY "Admins, líderes e professor responsável podem atualizar ensino" 
ON ensino FOR UPDATE 
USING (
  is_admin() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND cargo IN ('pastor', 'líder', 'professor')) OR
  EXISTS (SELECT 1 FROM membros WHERE id = ensino.professor_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Apenas admins podem excluir aulas
CREATE POLICY "Apenas admins podem excluir ensino" 
ON ensino FOR DELETE 
USING (is_admin());
```

### Políticas para `cultos`

```sql
-- Usuários autenticados podem ver cultos
CREATE POLICY "Usuários autenticados podem ver cultos" 
ON cultos FOR SELECT 
USING (auth.role() = 'authenticated');

-- Admins e pastores podem criar cultos
CREATE POLICY "Admins e pastores podem criar cultos" 
ON cultos FOR INSERT 
WITH CHECK (is_admin() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND cargo IN ('pastor', 'líder')
));

-- Admins, pastores, dirigentes e pregadores podem atualizar cultos
CREATE POLICY "Admins, pastores, dirigentes e pregadores podem atualizar cultos" 
ON cultos FOR UPDATE 
USING (
  is_admin() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND cargo IN ('pastor', 'líder')) OR
  EXISTS (SELECT 1 FROM membros WHERE id = cultos.dirigente_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  EXISTS (SELECT 1 FROM membros WHERE id = cultos.pregador_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Apenas admins podem excluir cultos
CREATE POLICY "Apenas admins podem excluir cultos" 
ON cultos FOR DELETE 
USING (is_admin());
```

### Políticas para `louvor` e `escala_louvor`

```sql
-- Usuários autenticados podem ver louvor
CREATE POLICY "Usuários autenticados podem ver louvor" 
ON louvor FOR SELECT 
USING (auth.role() = 'authenticated');

-- Usuários autenticados podem ver escala de louvor
CREATE POLICY "Usuários autenticados podem ver escala_louvor" 
ON escala_louvor FOR SELECT 
USING (auth.role() = 'authenticated');

-- Admins, líderes de louvor podem criar/atualizar escalas
CREATE POLICY "Admins e líderes de louvor podem criar escalas" 
ON escala_louvor FOR INSERT 
WITH CHECK (
  is_admin() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND cargo IN ('pastor', 'líder', 'ministro de louvor'))
);

-- Membros escalados podem atualizar apenas sua própria confirmação
CREATE POLICY "Membros escalados podem confirmar presença" 
ON escala_louvor FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM membros 
    WHERE id = escala_louvor.membro_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  NEW.membro_id = OLD.membro_id AND 
  NEW.louvor_id = OLD.louvor_id AND 
  NEW.funcao = OLD.funcao AND
  NEW.tipo = OLD.tipo
  -- Permite alterar apenas confirmacao e observacoes
);
```

## Funções e Triggers

### Função para contagem de participantes nas aulas

```sql
CREATE OR REPLACE FUNCTION atualizar_contagem_participantes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Atualiza o contador na tabela ensino
    UPDATE ensino
    SET participantes_count = (
      SELECT COUNT(*) FROM presenca_ensino 
      WHERE ensino_id = NEW.ensino_id AND presente = TRUE
    )
    WHERE id = NEW.ensino_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Atualiza o contador na tabela ensino
    UPDATE ensino
    SET participantes_count = (
      SELECT COUNT(*) FROM presenca_ensino 
      WHERE ensino_id = OLD.ensino_id AND presente = TRUE
    )
    WHERE id = OLD.ensino_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_participantes
AFTER INSERT OR UPDATE OR DELETE ON presenca_ensino
FOR EACH ROW
EXECUTE PROCEDURE atualizar_contagem_participantes();
```

### Função para registrar alterações

```sql
CREATE OR REPLACE FUNCTION registrar_alteracao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas principais
CREATE TRIGGER trigger_registrar_alteracao_membros
BEFORE INSERT OR UPDATE ON membros
FOR EACH ROW
EXECUTE PROCEDURE registrar_alteracao();

-- (Repetir para as demais tabelas)
```

## Autenticação e Autorização

### Configuração de Autenticação

1. No dashboard do Supabase, acesse **Authentication** > **Providers**
2. Habilite o Email provider com as seguintes configurações:
   - **Disable email confirmations**: Desativado (requer confirmação)
   - **Secure email change**: Ativado
   - **Custom email templates**: Personalizar emails de confirmação

3. Configure MFA (Multi-factor Authentication):
   - **SMS OTP**: Opcional, para segurança adicional
   - **TOTP**: Recomendado para administradores

### Configuração de Domínios Permitidos para Email

```
igreja.org.br
igreja-sede.com.br
ministerio-igreja.com
```

## Buckets de Armazenamento

### Bucket: `fotos-membros`

```sql
-- Criar bucket no dashboard ou via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-membros', 'Fotos dos Membros', TRUE);

-- Configurar RLS para o bucket
CREATE POLICY "Acesso público para visualização de fotos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fotos-membros');

CREATE POLICY "Apenas usuários autenticados podem inserir fotos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'fotos-membros' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Usuários podem atualizar suas próprias fotos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'fotos-membros' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem excluir suas próprias fotos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'fotos-membros' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Bucket: `materiais-ensino`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais-ensino', 'Materiais para Ensino', TRUE);

-- Configurar políticas RLS semelhantes ao bucket fotos-membros
-- ...
```

## API e Consultas Frequentes

### Consultas Otimizadas para o Frontend

```typescript
// Exemplo de função helper para o frontend
export async function getMembrosWithFuncao(funcao: string) {
  const { data, error } = await supabase
    .from('membros')
    .select('id, nome, foto_url, telefone, habilidades')
    .contains('funcao', [funcao])
    .eq('ativo', true)
    .order('nome');
  
  if (error) throw error;
  return data;
}

export async function getCultosProximos() {
  const dataAtual = new Date().toISOString();
  const { data, error } = await supabase
    .from('cultos')
    .select(`
      id, 
      data, 
      tipo, 
      ministerio,
      dirigente:dirigente_id(id, nome),
      pregador:pregador_id(id, nome)
    `)
    .gte('data', dataAtual)
    .order('data')
    .limit(5);
  
  if (error) throw error;
  return data;
}

export async function getEscalaLouvor(louvorId: string) {
  const { data, error } = await supabase
    .from('escala_louvor')
    .select(`
      id,
      funcao,
      tipo,
      confirmacao,
      membro:membro_id(id, nome, foto_url, telefone)
    `)
    .eq('louvor_id', louvorId)
    .order('tipo', { ascending: true })
    .order('funcao', { ascending: true });
  
  if (error) throw error;
  return data;
}
```

### Views para Relatórios

```sql
-- View para relatório de participação em aulas
CREATE VIEW view_relatorio_participacao AS
SELECT 
  e.data,
  e.titulo,
  e.categoria,
  e.classe,
  COUNT(pe.id) FILTER (WHERE pe.presente = TRUE) AS presentes,
  COUNT(pe.id) FILTER (WHERE pe.presente = FALSE) AS ausentes,
  prof.nome AS professor
FROM ensino e
LEFT JOIN presenca_ensino pe ON e.id = pe.ensino_id
LEFT JOIN membros prof ON e.professor_id = prof.id
GROUP BY e.id, prof.nome
ORDER BY e.data DESC;

-- View para estatísticas de membros por função
CREATE VIEW view_estatisticas_membros AS
SELECT 
  f AS funcao,
  COUNT(*) AS total
FROM membros,
LATERAL UNNEST(funcao) AS f
GROUP BY f
ORDER BY total DESC;
```

## Backups e Restauração

### Configuração de Backups Automáticos

No dashboard do Supabase:
1. Acesse **Database** > **Backups**
2. Configure backup diário para retenção de 7 dias
3. Para projetos em produção, considere backup com ponto de restauração (PITR)

### Procedimento para Exportação Manual

```sql
-- Exemplo de script de exportação
SELECT * 
FROM membros
WHERE updated_at > '2023-01-01'::date
ORDER BY nome;
```

---

## Manutenção e Monitoramento

### Índices para Otimização

```sql
-- Índice para busca por nome de membros (busca parcial)
CREATE INDEX idx_membros_nome ON membros USING gin (nome gin_trgm_ops);

-- Índice para datas de cultos (busca por intervalo)
CREATE INDEX idx_cultos_data ON cultos (data);

-- Índice para participação em aulas
CREATE INDEX idx_presenca_ensino_composite ON presenca_ensino (ensino_id, membro_id);
```

### Extensões Recomendadas

```sql
-- Pesquisa de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Unaccent para pesquisa sem acentos
CREATE EXTENSION IF NOT EXISTS unaccent;
```
