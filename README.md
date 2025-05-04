# Sistema de Gestão Eclesiástica

Sistema completo para gerenciamento de membros, escalas de ensino, cultos e ministério de louvor em igrejas, com autenticação, painéis interativos e integração com Supabase.

## ✨ Visão Geral
- Gerencie membros, equipes, escalas e eventos religiosos.
- Interfaces modernas com Next.js, React e TailwindCSS.
- Backend e autenticação via Supabase.

## 🚀 Stack Tecnológica
- **Frontend/Backend:** Next.js 14 (App Router, React 18)
- **Banco de Dados/Autenticação:** Supabase
- **UI:** TailwindCSS, Shadcn/UI
- **Formulários:** React Hook Form + Zod
- **Tabelas:** TanStack Table
- **API:** SWR ou React Query

## 📁 Estrutura de Pastas
```
app/                # Rotas e páginas Next.js
components/         # Componentes reutilizáveis
lib/                # Bibliotecas/utilitários
public/             # Assets públicos
styles/             # Estilos globais
supabase/           # Scripts e docs do backend
```

## ⚙️ Instalação
1. **Clone o repositório:**
   ```bash
   git clone <url-do-repo>
   cd escala-v3.03
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn
   ```
3. **Configure as variáveis de ambiente:**
   - Renomeie `.env.example` para `.env` e preencha com suas chaves do Supabase.
   - **Nunca compartilhe seu .env!**

## 🏁 Comandos Úteis
- `npm run dev` — Inicia o servidor de desenvolvimento
- `npm run build` — Gera build de produção
- `npm start` — Inicia o servidor em produção

## 🔐 Boas Práticas de Segurança
- **Nunca** compartilhe secrets, senhas ou chaves em arquivos versionados.
- Use sempre variáveis de ambiente e mantenha o `.env` fora do controle de versão.
- Troque imediatamente qualquer chave que tenha sido exposta.

## 📚 Documentação
- Veja a pasta [`supabase/docs`](./supabase/docs) para detalhes de configuração do backend.
- [roadmap.md](./roadmap.md): Etapas e progresso do projeto.

## 🙋‍♂️ Contribuição
1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas alterações (`git commit -am 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

Feito com ❤️ para gestão eclesiástica moderna.
