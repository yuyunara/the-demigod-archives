# THE DEMIGOD ARCHIVES

Portal comunitário para o RPG, com estética de terminal/arquivo restrito.

## O que já está incluído

- Cadastro e login por e-mail e senha (Supabase Auth).
- Painel inicial.
- Arquivo individual de personagem.
- Diário de bordo privado.
- Inventário privado.
- Mapa de relações privado.
- Mural coletivo.
- Questionário do Oráculo.
- Área de conquistas.
- Políticas de segurança no banco (Row Level Security).

## Requisitos

- Node.js 18 ou superior
- Uma conta Supabase (plano gratuito serve para começar)

## 1. Criar e configurar o banco

1. Crie um projeto em https://supabase.com/.
2. Abra **SQL Editor** no painel do Supabase.
3. Cole e execute todo o conteúdo de `supabase/schema.sql`.
4. Em **Project Settings > API**, copie Project URL e anon/public key.
5. Copie `.env.example` para um novo arquivo chamado `.env`.
6. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

A chave anon/public pode ser usada no navegador quando as políticas RLS estiverem ativas. Nunca coloque a `service_role` key no site.

## 2. Rodar no computador

Na pasta do projeto:

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite.

## 3. Criar a conta de administração

1. Cadastre sua própria conta pela tela inicial.
2. No Supabase, abra **SQL Editor**.
3. Execute, substituindo pelo seu e-mail:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'SEU_EMAIL_AQUI');
```

A interface reconhecerá o papel de administradora. Nesta primeira versão, a administração ainda é básica: o papel fica registrado no perfil e pode ser expandido com ferramentas administrativas.

## 4. Publicar para os jogadores

Você pode publicar o projeto em Vercel ou Netlify:

1. Envie a pasta do projeto para um repositório privado no GitHub.
2. Importe o repositório no Vercel/Netlify.
3. Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações do projeto.
4. Configure o comando de build `npm run build` e a pasta de saída `dist`.
5. Publique e compartilhe o link no Discord.

No Supabase Auth, ajuste **Site URL** e **Redirect URLs** para o endereço publicado. Para um grupo fechado, considere desativar inscrições públicas depois que todos os jogadores criarem suas contas, ou controlar convites pelo painel do Supabase.

## Observações da versão 1.0

- Os arquivos pessoais, diário, inventário e relações são privados para cada jogador.
- O mural é compartilhado por usuários autenticados.
- O questionário salva respostas; ainda não gera profecias automáticas.
- A área de conquistas exibe distintivos concedidos no banco; a concessão automática/admin será uma próxima etapa.
- O perfil de administrador é identificado pelo campo `role`. O painel administrativo completo e a moderação avançada ainda precisam ser implementados.
- O mural mostra publicações recentes e não oferece comentários nesta versão.

## Próximas melhorias sugeridas

- Painel administrativo para moderar mural e conceder conquistas.
- Perfil com avatar e chalé.
- Reações e comentários nas publicações.
- Profecias com resultados personalizados.
- Upload de imagens para fichas.
- Notificações e feed de novidades.