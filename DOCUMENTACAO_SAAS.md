# Fundação Estratégica: Ecossistema Digital para Igrejas (SaaS)

Este documento estabelece a fundação estratégica, arquitetural e de produto para a plataforma SaaS (Software as a Service) voltada para igrejas e ministérios cristãos. Ele serve como o "North Star" (Estrela Guia) para todas as fases subsequentes de design, desenvolvimento e expansão.

---

## 1. VISÃO DO PRODUTO

### Missão da Plataforma
Capacitar igrejas locais ao redor do mundo com tecnologia de ponta, permitindo que foquem no que realmente importa: cuidar de pessoas, fazer discípulos e expandir o Reino de Deus.

### Propósito Espiritual
Ser uma ferramenta que facilita a comunhão (Koinonia), o ensino da Palavra (Didache) e o serviço (Diakonia), quebrando barreiras geográficas e temporais para manter a igreja conectada 24/7.

### Problema que Resolve
Igrejas modernas sofrem com a fragmentação de ferramentas: usam um sistema para financeiro, planilhas para membros, WhatsApp para comunicação e papel para discipulado. Isso gera perda de dados, desconexão pastoral e ineficiência administrativa.

### Diferenciais
- **All-in-One Verdadeiro:** Gestão, comunidade e vida espiritual em um único ecossistema.
- **White-label / Personalização:** Cada igreja tem seu próprio app e identidade visual.
- **Foco no Indivíduo:** Não é apenas um ERP de igreja, é uma plataforma de crescimento espiritual para o membro.
- **Design Premium:** Interface moderna, intuitiva e agradável, no padrão dos melhores SaaS do mercado (Notion, Linear, Stripe).

### Valor para as Igrejas
- **Administrativo:** Redução de custos, centralização de dados e relatórios precisos.
- **Pastoral:** Acompanhamento real da saúde espiritual do rebanho, identificação de líderes e cuidado personalizado.
- **Comunidade:** Maior engajamento dos membros durante a semana, não apenas aos domingos.

### Impacto Global
Criar a maior infraestrutura digital para o corpo de Cristo, permitindo que desde pequenas congregações até megaigrejas tenham acesso a tecnologia de classe mundial.

---

## 2. PERSONAS DO SISTEMA

Para garantir que a plataforma atenda a todas as necessidades, definimos as seguintes personas:

### 1. Pastor (O Visionário/Cuidador)
- **Objetivos:** Acompanhar a saúde geral da igreja, cuidar das ovelhas, preparar sermões, gerenciar a liderança.
- **Necessidades:** Visão macro (dashboards), alertas de membros afastados, comunicação direta com a liderança.
- **Funcionalidades:** Dashboard pastoral, relatórios de crescimento, gestão de líderes, envio de mensagens globais.

### 2. Administrador (O Operacional)
- **Objetivos:** Manter a igreja funcionando sem atritos, gerenciar finanças, organizar eventos, manter o cadastro atualizado.
- **Necessidades:** Ferramentas eficientes de entrada de dados, conciliação bancária, gestão de inscrições.
- **Funcionalidades:** Módulo financeiro, gestão de membros (CRM), controle de patrimônio, gestão de eventos.

### 3. Líder de Ministério (O Coordenador)
- **Objetivos:** Organizar escalas, comunicar-se com sua equipe, treinar voluntários.
- **Necessidades:** Ferramenta de agendamento, chat focado na equipe, repositório de arquivos (cifras, roteiros).
- **Funcionalidades:** Gestão de escalas, chat de ministério, biblioteca de recursos.

### 4. Líder de Célula/Pequeno Grupo (O Discipulador)
- **Objetivos:** Cuidar do seu pequeno grupo, registrar presenças, levantar novos líderes.
- **Necessidades:** Acesso rápido aos dados dos membros da célula, registro de reuniões simples, material de estudo.
- **Funcionalidades:** Gestão de célula, relatório de reunião, acesso ao esboço da semana.

### 5. Professor da Escola Bíblica (O Ensinador)
- **Objetivos:** Transmitir conhecimento, acompanhar o aprendizado, interagir com os alunos.
- **Necessidades:** Plataforma de aulas, controle de frequência, espaço para dúvidas.
- **Funcionalidades:** Módulo EAD (Escola Bíblica), fórum de dúvidas, diário de classe.

### 6. Membro (O Fiel)
- **Objetivos:** Crescer espiritualmente, conectar-se com irmãos, servir na igreja, dizimar/ofertar.
- **Necessidades:** Acesso a devocionais, facilidade para doar, comunicação com a célula, inscrições em eventos.
- **Funcionalidades:** Feed da comunidade, devocional diário, doações 1-click, perfil espiritual, carteirinha digital.

### 7. Visitante (O Inquiridor)
- **Objetivos:** Conhecer a igreja, pedir oração, entender os próximos passos.
- **Necessidades:** Informações claras, acolhimento, formulários simples.
- **Funcionalidades:** Cartão de visitante digital, pedidos de oração públicos, trilha de integração.

---

## 3. ESTRUTURA DO ECOSSISTEMA

A arquitetura conceitual é baseada em um modelo Multi-Tenant (Múltiplos Inquilinos), onde o SaaS central gerencia múltiplas instâncias isoladas de igrejas.

### 1. Plataforma SaaS (O Core)
- O motor principal que gerencia assinaturas, provisionamento de novas igrejas, atualizações globais e infraestrutura de banco de dados.

### 2. A Igreja (O Tenant)
- Um ambiente isolado (banco de dados lógico ou físico separado) contendo todos os dados, configurações e identidade visual de uma congregação específica.

### 3. Painel Administrativo (Web)
- Interface desktop robusta para Pastores e Administradores gerenciarem toda a operação da igreja (CRM, Financeiro, Relatórios).

### 4. Aplicativo da Igreja (Mobile/PWA)
- A interface principal para o Membro e Visitante. Focado em engajamento diário, vida espiritual e comunidade. Pode ser "White-label" (publicado nas lojas com o nome da igreja) ou acessado via PWA.

### 5. Rede Social Interna (A Comunidade)
- Um ambiente seguro e privado para os membros compartilharem testemunhos, pedidos de oração e avisos, livre das distrações das redes sociais seculares.

### 6. Sistema de Gestão (O Backoffice)
- O conjunto de ferramentas que mantém a igreja organizada: cadastros, financeiro, escalas, patrimônio.

### 7. Discipulado Digital (O Crescimento)
- Ferramentas focadas no indivíduo: devocionais, trilhas de ensino, acompanhamento pastoral e diário espiritual.

---

## 4. LISTA COMPLETA DE MÓDULOS

O sistema é modular, permitindo que a igreja ative apenas o que precisa.

1. **Gestão de Membros (CRM):** Cadastro completo, histórico de vida na igreja, campos personalizados, carteirinha digital.
2. **Gestão de Visitantes:** Funil de integração (consolidação), acompanhamento de primeiros contatos, conversão de visitante para membro.
3. **Ministérios e Escalas:** Criação de departamentos (Louvor, Infantil, etc.), gestão de voluntários, geração automática de escalas com confirmação via app.
4. **Células / Pequenos Grupos:** Mapeamento geográfico, relatórios de frequência, gestão de multiplicação, materiais de estudo semanais.
5. **Escola Bíblica (EAD):** Cursos online e presenciais, trilhas de crescimento (ex: Classe de Novos Decididos, Batismo), controle de presença e notas.
6. **Discipulado e Mentoria:** Registro de encontros de discipulado 1-a-1, acompanhamento de metas espirituais, confidencialidade.
7. **Eventos e Inscrições:** Calendário da igreja, venda de ingressos/inscrições para retiros e conferências, check-in via QR Code.
8. **Devocional e Leitura Bíblica:** Planos de leitura, devocionais diários da igreja, diário espiritual privado do membro.
9. **Pedidos de Oração:** Mural de oração (público ou privado), botão "Estou orando por isso", notificações de orações respondidas.
10. **Evangelismo e Missões:** Mapa de alcance, gestão de projetos missionários, relatórios de impacto social.
11. **Financeiro (Tesouraria):** Entradas (Dízimos/Ofertas), saídas, conciliação bancária, relatórios contábeis, integração com gateways de pagamento (Pix, Cartão).
12. **Mídia e Conteúdo:** Repositório de pregações (áudio/vídeo), boletim semanal digital, galeria de fotos.
13. **Rede Social da Igreja:** Feed de notícias, grupos de interesse, curtidas ("Amém") e comentários.
14. **Marketplace Cristão (Opcional):** Lojinha da igreja (livros, camisetas), venda de materiais dos ministérios.
15. **Painel de Inteligência (Analytics):** Dashboards de saúde da igreja, taxa de retenção, engajamento, previsões financeiras.

---

## 5. FLUXO PRINCIPAL DO SISTEMA (Onboarding)

Como uma igreja entra e começa a usar a plataforma:

### Passo 1: Cadastro da Igreja (SaaS)
O Pastor ou Administrador acessa o site da plataforma SaaS, escolhe um plano, insere os dados básicos da igreja e cria a conta "Master".

### Passo 2: Criação do Painel e Isolamento (Setup)
O sistema provisiona automaticamente um banco de dados isolado para a igreja, gera a URL personalizada (ex: `app.plataforma.com/minhaigreja`) e configura o ambiente inicial.

### Passo 3: Personalização (Branding)
O Administrador faz o upload da logo da igreja, escolhe as cores primárias, define o nome do aplicativo e configura os dados bancários para recebimento.

### Passo 4: Estruturação Inicial
O Administrador cadastra os primeiros Ministérios, Células e a Liderança principal.

### Passo 5: Cadastro de Membros (Rollout)
A igreja importa sua base de dados antiga (via CSV) ou gera um "Código de Convite" / Link de Cadastro.
O Pastor anuncia o novo aplicativo no culto de domingo.

### Passo 6: Adoção pelos Membros
Os membros baixam o app, inserem o código da igreja, criam seus perfis e começam a interagir (feed, doações, devocionais).

### Passo 7: Uso Contínuo e Gestão
A liderança passa a usar os painéis para gerenciar a igreja no dia a dia, baseada em dados reais gerados pelo engajamento dos membros no app.

---

## 6. ROADMAP DE DESENVOLVIMENTO

O projeto será construído em fases iterativas para garantir entrega de valor rápida e validação contínua.

### Fase 1: Fundação Técnica e Identidade (MVP)
- Arquitetura Multi-tenant (SaaS).
- Autenticação e Autorização (RBAC - Role Based Access Control).
- Design System e UI/UX base (Padrão Premium).
- Onboarding de Igrejas (Criação do Tenant).
- App do Membro: Perfil básico, Feed da Comunidade (Mural) e Pedidos de Oração.

### Fase 2: Gestão Administrativa e Financeira
- Painel Web Administrativo.
- CRM: Gestão completa de Membros e Visitantes.
- Módulo Financeiro Básico (Registro manual de entradas e saídas).
- Integração de Pagamentos (Doações via Pix e Cartão no App).

### Fase 3: Organização e Vida em Comunidade
- Módulo de Células / Pequenos Grupos.
- Módulo de Ministérios e Escalas de Voluntários.
- Gestão de Eventos e Calendário.
- Check-in via QR Code.

### Fase 4: Crescimento Espiritual e Ensino
- Módulo de Escola Bíblica (EAD).
- Devocionais Diários e Planos de Leitura.
- Diário Espiritual e Mentoria (Discipulado 1-a-1).
- Gamificação leve (Badges por consistência).

### Fase 5: Inteligência Artificial e Expansão Global
- Dashboards Avançados e Analytics.
- IA para Pastores: Sugestão de temas baseada nos pedidos de oração da congregação.
- IA para Membros: Assistente bíblico integrado ao devocional.
- Internacionalização (Multi-idiomas) e White-label completo (Apps nativos nas lojas).

---

## 7. STATUS DE IMPLEMENTAÇÃO E PRÓXIMOS PASSOS

Atualmente, o núcleo do **Diário Espiritual**, **Comunidade**, **Devocional**, **Mentor Espiritual** e funcionalidades básicas de **Administração** (Membros, Eventos, Financeiro, Células, Ministérios) já estão implementados.

### Módulos Pendentes (Ainda não implementados)
Os seguintes módulos previstos na arquitetura original ainda aguardam desenvolvimento:
- **Gestão de Visitantes:** Funil de integração e acompanhamento.
- **Escola Bíblica (EAD):** Cursos, trilhas de crescimento e controle de presença.
- **Discipulado e Mentoria:** Registro de encontros 1-a-1 e acompanhamento de metas.
- **Evangelismo e Missões:** Mapa de alcance e gestão de projetos missionários.
- **Mídia e Conteúdo:** Repositório de pregações e boletim digital.
- **Marketplace Cristão:** Lojinha da igreja e venda de materiais.

### Sugestão de Novo Módulo: Gestão de "Oração e Intercessão"
Sugerimos a evolução do conceito básico de "Pedidos de Oração" para um módulo completo e dedicado de **Oração e Intercessão**, contendo as seguintes características:
- **Pedidos Públicos e Privados:** Opção para o membro escolher se o pedido vai para o mural da igreja ou apenas para a equipe pastoral/intercessores.
- **Acompanhamento de Intercessões:** Botão "Estou orando por isso" que notifica o autor do pedido, criando uma rede de apoio visível.
- **Diário de Orações Respondidas:** Transição de um pedido ativo para um testemunho de oração respondida, com notificações para todos que intercederam.
- **Grupos de Intercessão:** Áreas restritas para o ministério de intercessão gerenciar campanhas de oração e propósitos específicos da igreja.
- **Lembretes Personalizados:** Alertas push para lembrar os membros de orarem pelos motivos que eles se comprometeram a interceder.
