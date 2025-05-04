# Roadmap de Desenvolvimento - Sistema de Gestão Eclesiástica

## Visão Geral
Aplicativo integrado para gerenciamento de escalas e programação de eventos religiosos:
- Membros, obreiros, líderes, visitantes, 
- Escalas de professores para ensino (EBD, Discipulado, etc)
- Programação de cultos (Escalas de pregadores e dirigentes)
- Ministério de louvor (Escalas de equipes musicais e midia)

## Stack Tecnológica
- **Frontend & Backend**: Next.js (Monorepo Fullstack)
- **Banco de Dados & Auth**: Supabase
- **Estilo**: TailwindCSS
- **Exportação PDF**: API Next.js + bibliotecas Node


## Dados de Acesso Supabase
```
supabase
Database password: t9P30bwTrVuARmzk

Project Url: https://tljlfjmnbbxntsgqczyw.supabase.co

anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsamxmam1uYmJ4bnRzZ3Fjenl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNDc3OTQsImV4cCI6MjA2MTcyMzc5NH0.KutA2-hdiaCPS8brCGS-36HmRsyOJetOrzZRHd4Cy8w

service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsamxmam1uYmJ4bnRzZ3Fjenl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE0Nzc5NCwiZXhwIjoyMDYxNzIzNzk0fQ.TikYFVZW1hFzS7Vv7_ANavbGF7noEC1O1tQyK8-hxuo

JWT Secret: EQQJ0PpsZ9s6V8+xh/T/04U9hChFeC4gWIvAhFJjZC1Wjnk72CT0qBkN6RTa+RO5oDPK0BgReONdiCInB4sI4A==
```

## Estrutura Modular Sugerida
- Módulo de Membros: Cadastro e gestão de membros, funções e habilidades
- Módulo de Ensino: Escalas de professores para EBD, Discipulado, etc
- Módulo de Cultos: Programação de eventos e pregações
- Módulo de Louvor: Gestão de equipes musicais

## Requisitos Funcionais (RF)

1. O sistema deve permitir o cadastro, edição, exclusão e consulta de membros, incluindo dados pessoais, funções ministeriais e habilidades musicais.
2. O sistema deve permitir o registro e a gestão de escalas de ensino (EBD), incluindo a atribuição automática e manual de professores.
3. O sistema deve permitir a programação de cultos e eventos, com cadastro de pregadores e dirigentes.
4. O sistema deve permitir a criação e gestão de escalas do ministério de louvor, considerando habilidades e disponibilidade dos membros.
5. O sistema deve disponibilizar visualização consolidada das escalas e eventos futuros para administradores e membros.
6. O sistema deve prover autenticação e controle de acesso baseado em papéis (admin, lider, membro, visitante).
7. O sistema deve disponibilizar relatórios de presença, participação e histórico de escalas.

## Requisitos Não Funcionais (RNF)

1. O sistema deve ser responsivo, permitindo acesso eficiente em dispositivos móveis e desktops.
2. O sistema deve garantir a segurança dos dados, utilizando autenticação JWT e criptografia de dados sensíveis.
3. O sistema deve ser documentado e de fácil manutenção, seguindo boas práticas de desenvolvimento.
4. O sistema deve registrar logs de erros e atividades relevantes para auditoria.
5. O sistema deve permitir backup e restauração dos dados.
6. O sistema terá um arquivo de deploy para debian 12.
---

## Fase 1: Fundação (Semanas 1-3)

### Semana 1: Setup Inicial
- Criar repositório Git seguindo a estrutura de pastas documentada

### Semana 2-3: Modelagem do Banco de Dados


## Fase 2: Módulos Essenciais (Semanas 4-8)

### Semana 4-5: Módulo de Membros
- Implementar backend para CRUD de membros
- Desenvolver interfaces para cadastro de membros
- Implementar gestão de funções ministeriais e habilidades musicais
- Criar sistema de registro de disponibilidade semanal

### Semana 6-7: Módulo de Louvor
- Implementar modelo de dados para escalas de louvor
- Desenvolver interface para gestão de instrumentistas e vocais
- Criar funcionalidade de atribuição de membros baseada em habilidades
- Implementar sistema para registro de instrumentos necessários por evento

### Semana 8: API e Integrações
- Desenvolver endpoints 
- Implementar rotas para geração e edição de escalas
- Criar documentação interativa da API
- Testar integração entre módulos

## Fase 3: Módulos Complementares (Semanas 9-12)

### Semana 9-10: Módulo de Ensino (EBD, Discipulado, etc)
- Implementar backend para gestão de classes e professores
- Desenvolver interface para programação de aulas
- Criar sistema de rotação automática de professores
- Implementar relatórios de presença e participação

### Semana 11-12: Módulo de Cultos
- Desenvolver sistema de programação de eventos e pregações
- Implementar gestão de participantes por culto
- Desenvolver dashboard com visão consolidada dos próximos eventos

## Fase 4: Refinamento e Lançamento (Semanas 13-16)

### Semana 13-14: Refinamento de UX/UI
- Aprimorar interfaces
- Implementar design responsivo para acesso móvel
- Realizar testes de usabilidade com usuários finais
- Ajustar experiência com base nos feedbacks

### Semana 15: Testes e Qualidade
- Implementar testes automatizados
- Configurar pipeline CI/CD
- Realizar teste integrado de todos os módulos
- Corrigir bugs e otimizar desempenho
