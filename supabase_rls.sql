-- EXECUTAR ESTE SQL NO EDITOR SQL DO SUPABASE (https://app.supabase.com/)

-- 1. Habilitar RLS nas tabelas
ALTER TABLE public.conexoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA A TABELA 'conexoes'
-- ==========================================

-- Permite que qualquer usuário autenticado inicie uma conexão (chat)
DROP POLICY IF EXISTS "Usuários podem iniciar conexões" ON public.conexoes;
CREATE POLICY "Usuários podem iniciar conexões" 
ON public.conexoes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = remetente_id);

-- Permite ver a conexão se o usuário for o remetente ou o destinatário
DROP POLICY IF EXISTS "Usuários podem ver suas próprias conexões" ON public.conexoes;
CREATE POLICY "Usuários podem ver suas próprias conexões" 
ON public.conexoes FOR SELECT 
TO authenticated 
USING (auth.uid()::text = remetente_id OR auth.uid()::text = destinatario_id);

-- Permite atualizar a conexão (ex: aceitar/alterar status) se fizer parte dela
DROP POLICY IF EXISTS "Usuários podem atualizar suas conexões" ON public.conexoes;
CREATE POLICY "Usuários podem atualizar suas conexões" 
ON public.conexoes FOR UPDATE
TO authenticated
USING (auth.uid()::text = remetente_id OR auth.uid()::text = destinatario_id);


-- ==========================================
-- POLÍTICAS PARA A TABELA 'mensagens'
-- ==========================================

-- Permite enviar mensagens se o autor for o próprio usuário logado
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON public.mensagens;
CREATE POLICY "Usuários podem enviar mensagens" 
ON public.mensagens FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = autor_id);

-- Permite ler mensagens se o usuário fizer parte da conexão vinculada
DROP POLICY IF EXISTS "Usuários podem ler mensagens de suas conexões" ON public.mensagens;
CREATE POLICY "Usuários podem ler mensagens de suas conexões" 
ON public.mensagens FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conexoes 
    WHERE public.conexoes.id = public.mensagens.conexao_id 
    AND (remetente_id = auth.uid()::text OR destinatario_id = auth.uid()::text)
  )
);


-- ==========================================
-- INTEGRIDADE E AUTOMAÇÃO (Function & Trigger)
-- ==========================================

-- Garante status 'pendente' e evita duplicidade de chats entre os mesmos usuários
CREATE OR REPLACE FUNCTION public.handle_new_chat_connection()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Status padrão 'pendente' se não fornecido
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'pendente';
  END IF;

  -- 2. Bloqueia criação de conexão se já existir entre os dois (independente de quem enviou)
  IF EXISTS (
    SELECT 1 FROM public.conexoes
    WHERE (remetente_id = NEW.remetente_id AND destinatario_id = NEW.destinatario_id)
       OR (remetente_id = NEW.destinatario_id AND destinatario_id = NEW.remetente_id)
  ) THEN
    RAISE EXCEPTION 'Uma conexão entre estes usuários já existe.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativa o trigger para manter a integridade
DROP TRIGGER IF EXISTS on_chat_connection_created ON public.conexoes;
CREATE TRIGGER on_chat_connection_created
BEFORE INSERT ON public.conexoes
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_chat_connection();
