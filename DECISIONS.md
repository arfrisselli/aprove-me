# Decisões Técnicas — Aprove-me (Bankme)

Este documento registra decisões arquiteturais e técnicas tomadas durante o desenvolvimento do desafio Aprove-me. Para cada decisão constam **motivos**, **pontos positivos** e **possíveis drawbacks**, para que qualquer engenheiro (ou gestor) possa avaliar trade-offs com contexto completo.

---

## 1. Estrutura do repositório — monorepo

**Decisão:** Backend e frontend no mesmo repositório (`/backend` e `/frontend`).

**Motivos:**

- Entrega do desafio como unidade coesa e revisão única no Git.
- Um `docker-compose` na raiz sobe API, frontend, Redis e MailHog sem coordenar versões entre repositórios.
- CI em um único workflow com jobs por pasta.

**Pontos positivos:** Menos overhead de versionamento cruzado; clone e onboarding em um passo; refactors que tocam API e UI ficam no mesmo PR.

**Possíveis drawbacks:** Repositório cresce com dois `node_modules` e duas pipelines de teste; sem ferramenta de monorepo (Nx/Turborepo), não há cache de build compartilhado entre pacotes — aceitável para o tamanho atual do projeto.

---

## 2. Back-end — NestJS

**Decisão:** NestJS como framework HTTP e organização da aplicação.

**Motivos:**

- Alinhado ao escopo do desafio (stack esperada).
- Módulos, injeção de dependência e guards encaixam bem em domínios separados (payable, assignor, auth, mail, fila).

**Pontos positivos:** Padrões claros (módulo/controller/service); ecossistema maduro para validação, JWT e filas; facilita onboarding de quem já usa Angular ou padrões enterprise.

**Possíveis drawbacks:** Mais boilerplate e curva de aprendizado que frameworks minimalistas (Fastify “puro”, Hono); abstrações podem parecer pesadas para APIs muito pequenas.

---

## 3. Arquitetura modular — DDD leve

**Decisão:** Um módulo NestJS por área de negócio (`PayableModule`, `AssignorModule`, `AuthModule`, `MailModule`, `PrismaModule`, etc.).

**Motivos:**

- Responsabilidade por domínio facilita localizar regras e testes.
- `PrismaModule` global evita importar o mesmo módulo de persistência em todo arquivo que acessa o banco.

**Pontos positivos:** Evolução independente de cada bloco; testes podem mockar módulos vizinhos com fronteiras claras.

**Possíveis drawbacks:** “Módulo demais” para poucas rotas pode gerar arquivos extras; dependências circulares exigem disciplina (NestJS ajuda a detectar, mas não elimina o problema de desenho).

---

## 4. ORM — Prisma (7.x) com SQLite e driver nativo

**Decisão:** Prisma como camada de dados; **SQLite** como banco no código atual; cliente gerado em `src/generated/prisma`; uso do **adapter `@prisma/adapter-better-sqlite3`** no `PrismaService`.

**Motivos:**

- Prisma foi pedido no desafio; tipagem gerada a partir do schema reduz erros de coluna/tipo em tempo de compilação.
- SQLite dispensa servidor de banco no desenvolvimento local e simplifica testes e CI (arquivo `dev.db`).
- Prisma 7 recomenda drivers nativos por performance; `better-sqlite3` é síncrono e consolidado no ecossistema Node.

**Pontos positivos:** Migrações versionadas; uma única fonte de verdade (`schema.prisma`); sem serviço PostgreSQL obrigatório para rodar o projeto.

**Possíveis drawbacks:** SQLite não substitui PostgreSQL em cenários de muita concorrência de escrita ou réplicas; migração futura para PostgreSQL exige trocar `datasource`, adapter e possivelmente tipos (`Decimal`, enums). Em **ECS**, a URL `file:./prod.db` persiste no filesystem efêmero do container — aceitável para demonstração, mas **não** é padrão para produção crítica sem volume (EFS) ou RDS.

---

## 5. Restrição de negócio — documento único do cedente

**Decisão:** Campo `document` do cedente com constraint `@unique` no Prisma (um mesmo CPF/CNPJ não cadastra dois cedentes).

**Motivos:**

- Regra de integridade: documento identifica pessoa jurídica ou física no contexto brasileiro; duplicata geraria inconsistência em relatórios e integrações.
- Falha explícita na API (ex.: conflito ao criar) em vez de dados duplicados silenciosos.

**Pontos positivos:** Garantia no banco, não só na aplicação; mensagens de erro podem ser tratadas no frontend (ex.: toast).

**Possíveis drawbacks:** Cedentes “iguais” com grafias diferentes de documento (máscara/normalização) exigem normalização consistente no backend antes do insert — hoje há utilitários de documento no backend e formatação de exibição no frontend.

---

## 6. Validação de DTOs — class-validator + class-transformer

**Decisão:** `ValidationPipe` global com `transform: true`, `whitelist: true`, `enableImplicitConversion: true`; `forbidNonWhitelisted: false`.

**Motivos:**

- Padrão natural do NestJS; regras ficam nos DTOs com decorators (`@IsUUID()`, `@MaxLength()`, etc.).
- `whitelist` remove propriedades não declaradas no DTO, reduzindo injeção de campos inesperados.
- `forbidNonWhitelisted: false` evita erro duro em clientes que enviam campos extras legados — trade-off de tolerância vs. rigidez.

**Pontos positivos:** Uma camada só para validação e coerção de tipos; menos código manual nos controllers.

**Possíveis drawbacks:** Decorators podem ficar verbosos; validações muito dependentes de `class-transformer` podem surpreender se os tipos implícitos não baterem com o JSON real.

---

## 7. Configuração — @nestjs/config

**Decisão:** Variáveis como `DATABASE_URL`, `JWT_SECRET`, Redis, e-mail e `PORT` lidas via `ConfigService`.

**Motivos:**

- Centraliza leitura de ambiente e facilita testes (mock de config).
- Diferença entre Docker (`REDIS_HOST=redis`) e localhost fica só no `.env`, sem hardcode.

**Pontos positivos:** Doze-factor friendly; mesma imagem Docker com parâmetros diferentes por ambiente.

**Possíveis drawbacks:** Sem schema de env validado na subida (ex.: Zod/env-var), erro de variável faltando só em runtime — mitigável com validação explícita no bootstrap se o projeto crescer.

---

## 8. Autenticação — JWT com Passport e guard global

**Decisão:** `@nestjs/passport` + `passport-jwt`; `JwtAuthGuard` registrado como `APP_GUARD`; rotas públicas com decorator `@Public()`.

**Motivos:**

- JWT é stateless e combina com API REST e SPA.
- **Segurança por padrão:** toda rota exige token salvo exceções explícitas — reduz risco de esquecer `@UseGuards` em endpoint novo.

**Pontos positivos:** Modelo mental simples (“público só onde marcar”); integração direta com Swagger (`addBearerAuth()`).

**Possíveis drawbacks:** **Expiração de 1 minuto** (requisito do desafio) força re-login frequente sem refresh token; revogação de sessão antes do exp é limitada sem blacklist ou refresh rotation.

---

## 9. Hash de senhas — bcrypt

**Decisão:** bcrypt com custo (salt rounds) padrão da biblioteca (ordem de 10).

**Motivos:**

- Padrão da indústria; resistência a rainbow tables com salt por senha.
- Custo computacional intencional freia brute force online.

**Pontos positivos:** APIs estáveis e auditáveis; não armazena senha em claro.

**Possíveis drawbacks:** Hash mais lento que algoritmos modernos tipo Argon2 em alguns benchmarks; para este volume, impacto é irrelevante.

---

## 10. Fila assíncrona — BullMQ + Redis

**Decisão:** BullMQ com Redis para processar lotes grandes de pagáveis de forma assíncrona.

**Motivos:**

- Desafio exige processamento assíncrono para lotes de até 10.000 itens.
- Redis oferece persistência e filas duráveis; fila só em memória perderia jobs ao reiniciar o processo.

**Pontos positivos:** Retries, backoff e separação de carga entre request HTTP e workers; `@nestjs/bullmq` integra ao ciclo de vida da aplicação.

**Possíveis drawbacks:** Redis é mais uma peça operacional (local ou ElastiCache); sem Redis, fluxos de fila falham — documentado no README.

---

## 11. Resiliência — retentativas e dead letter

**Decisão:** Política de múltiplas tentativas com backoff exponencial e fila de dead letter para jobs que esgotam tentativas.

**Motivos:**

- Falhas transitórias (rede, lock) não devem descartar o trabalho na primeira falha.
- Itens definitivamente inválidos precisam ir para inspeção manual sem bloquear a fila principal.

**Pontos positivos:** Melhor observabilidade e recuperação; alinhado a boas práticas de filas.

**Possíveis drawbacks:** Mais complexidade operacional (monitorar DLQ); sem processamento automático da DLQ, alguém precisa intervir.

---

## 12. E-mail — Nodemailer + MailHog (dev)

**Decisão:** Nodemailer para SMTP; MailHog no Docker em desenvolvimento.

**Motivos:**

- Testar envios sem disparar e-mail real nem depender de API paga no dia a dia.
- UI do MailHog (porta 8025) permite inspecionar o mesmo HTML/texto que iria ao cliente.

**Pontos positivos:** Loop de feedback rápido; variáveis de produção podem apontar para SES/SendGrid sem mudar código.

**Possíveis drawbacks:** MailHog não valida SPF/DKIM nem entregabilidade real; comportamento pode diferir levemente de provedores reais.

---

## 13. Limite do body HTTP — 50 MB

**Decisão:** `express.json({ limit: '50mb' })` no `main.ts`.

**Motivos:**

- Limite padrão do Express (~100 KB) cortaria requisições com milhares de pagáveis no JSON.
- Margem acima do tamanho estimado do lote evita `413 Payload Too Large` opaco.

**Pontos positivos:** Comportamento previsível para o cliente; documentado no código.

**Possíveis drawbacks:** Abre margem para requisições muito grandes e uso de memória no servidor — em produção real, validaria tamanho máximo por rota ou streaming/chunked upload.

---

## 14. Contrato do POST de pagável — payload aninhado

**Decisão:** Um único POST com objetos `payable` e `assignor` aninhados quando o fluxo cria recebível e dados do cedente juntos.

**Motivos:**

- Enunciado pede receber recebível e cedente; criação em uma chamada evita corrida entre dois POSTs e mantém transação coerente no serviço.

**Pontos positivos:** Menos round-trips; frontend envia um formulário alinhado ao modelo mental do usuário.

**Possíveis drawbacks:** Payload mais verboso; validação e documentação Swagger precisam refletir o aninhamento com clareza.

---

## 15. Rotas de listagem — GET sem `:id`

**Decisão:** `GET /integrations/payable` e `GET /integrations/assignor` para listar todos os registros (além dos GET por id).

**Motivos:**

- O frontend com telas de listagem precisa de fonte de dados; o desafio de backend não listava explicitamente, mas o fluxo de UI sim.

**Pontos positivos:** CRUD utilizável ponta a ponta; facilita demos e testes manuais.

**Possíveis drawbacks:** Sem paginação/filtros no escopo mínimo, listas grandes podem pesar no JSON e no render — evolução natural seria cursor/offset e campos mínimos.

---

## 16. Documentação HTTP — OpenAPI (Swagger)

**Decisão:** `@nestjs/swagger` com UI em `/docs`, título/descrição/versionamento e `Bearer` auth.

**Motivos:**

- Contrato visível para quem integra sem ler só o código; testes manuais rápidos com “Authorize”.
- Reduz divergência entre “o que a API faz” e o que o time acha que faz.

**Pontos positivos:** Onboarding e QA mais rápidos; geração futura de cliente TS é possível a partir do mesmo spec.

**Possíveis drawbacks:** Decorators extras nos DTOs/controllers; em produção pública, `/docs` pode ser desligado ou protegido para reduzir superfície de informação.

---

## 17. Front-end — React + Vite + TypeScript

**Decisão:** React (19.x no lockfile atual), Vite, TypeScript estrito no build.

**Motivos:**

- Vite oferece dev server e HMR rápidos em relação a bundlers mais antigos.
- TypeScript reduz erros ao consumir a API e evoluir componentes.

**Pontos positivos:** Ecossistema amplo; build de produção enxuta.

**Possíveis drawbacks:** Duplicação de tipos em relação ao backend se não houver geração automática a partir do OpenAPI.

---

## 18. Formulários — React Hook Form + Zod

**Decisão:** React Hook Form com resolver Zod (`@hookform/resolvers`).

**Motivos:**

- Menos re-renders que formulários totalmente controlados para formulários médios/grandes.
- Zod centraliza regras e permite inferir tipos (`z.infer`).

**Pontos positivos:** UX e validação alinhadas; mensagens de erro consistentes.

**Possíveis drawbacks:** Curva para quem só conhece validação imperativa; schemas Zod precisam ser mantidos alinhados aos DTOs do Nest.

---

## 19. Estado de servidor — TanStack Query

**Decisão:** TanStack Query para fetch, cache, estados de loading/erro e invalidação após mutations.

**Motivos:**

- Evita boilerplate de `useEffect` + `useState` para cada endpoint.
- Cache e deduplicação melhoram sensação de performance na navegação.

**Pontos positivos:** Padrão da indústria para SPAs com API REST; integra bem com axios.

**Possíveis drawbacks:** Curva de conceitos (stale time, query keys); para estado puramente de UI local, Context ou estado local ainda são mais simples.

---

## 20. Cliente HTTP — Axios e interceptors

**Decisão:** Axios com interceptor que injeta `Authorization: Bearer` e tratamento de `401` (ex.: redirecionar ao login).

**Motivos:**

- Um único lugar para o token evita esquecer o header em uma chamada nova.
- Sessão expirada vira fluxo de re-autenticação previsível.

**Pontos positivos:** DRY no cliente HTTP; fácil estender para refresh se o backend evoluir.

**Possíveis drawbacks:** Axios adiciona peso vs. `fetch` nativo; interceptors globais exigem cuidado para não mascarar erros que deveriam ser tratados localmente.

---

## 21. Tratamento de erros na UI — toast e mensagem da API

**Decisão:** Contexto de toast de erro (`ErrorToastProvider` + `useErrorToast`) e utilitário `getApiErrorMessage` para extrair `message` de respostas NestJS/Axios.

**Motivos:**

- Usuário vê falha de rede ou validação sem console; mensagens do backend (string ou array) são exibidas de forma legível.
- Separação entre “como mostrar” (UI) e “como parsear” (`apiError`).

**Pontos positivos:** Experiência consistente; menos `alert()` ad hoc.

**Possíveis drawbacks:** Context exige árvore de providers; erros não tratados em uma tela específica ainda precisam chamar `showError` de propósito.

---

## 22. Navegação — React Router

**Decisão:** `react-router-dom` para rotas da SPA (login, listagens, etc.).

**Motivos:**

- Padrão de mercado para React; URLs bookmarkáveis e histórico do browser.

**Pontos positivos:** Lazy loading e layouts aninhados disponíveis se o app crescer.

**Possíveis drawbacks:** Configuração de base path em deploy atrás de ALB precisa bater com build (`homepage` ou `basename`) — já considerado em setups com path prefix.

---

## 23. Estilização — Tailwind CSS (4.x)

**Decisão:** Tailwind com plugin Vite (`@tailwindcss/vite`).

**Motivos:**

- Iteração rápida de UI com utilitários; sem convenção de nome de classes “CSS modules” para cada tela pequena.
- Versão 4 integra bem ao pipeline do Vite atual.

**Pontos positivos:** Design responsivo e tema consistente com menos CSS solto; tree-shaking de estilos não usados na build.

**Possíveis drawbacks:** HTML pode ficar carregado de classes; equipes às vezes preferem design system com componentes pré-estilizados (MUI, Chakra) para acessibilidade out-of-the-box.

---

## 24. Apresentação — formatação de CPF/CNPJ no cliente

**Decisão:** Função utilitária (`formatCpfCnpjDisplay`) para máscara visual a partir de dígitos ou string já mascarada.

**Motivos:**

- Documentos brasileiros têm formatos fixos; exibir bonito melhora leitura em tabelas e detalhes.
- Normalização forte fica no backend; o front cuida da camada de exibição.

**Pontos positivos:** Reuso e testes unitários simples; não acopla formatação a um componente só.

**Possíveis drawbacks:** Duplicação parcial com regras do backend se a máscara de input editável for adicionada depois — convém compartilhar testes ou contrato único.

---

## 25. Infraestrutura local — Docker e docker-compose

**Decisão:** Imagens Docker para API e frontend; Compose na raiz com Redis, MailHog, dependências e healthchecks onde aplicável; opcionalmente `docker compose watch` para rebuild.

**Motivos:**

- Ambiente reprodutível; “funciona na minha máquina” reduzido.
- Serviços auxiliares (Redis, SMTP fake) sem instalar nativamente no host.

**Pontos positivos:** Onboarding em um comando; paridade mais próxima com deploy de container.

**Possíveis drawbacks:** Primeira build pode ser lenta; em dev diário o README sugere npm + só Redis/MailHog no Docker para seed SQLite local mais simples.

---

## 26. Cloud — AWS (ECR, ECS Fargate, ALB, ElastiCache) e GitHub Actions

**Decisão:** CI no GitHub Actions: testes de backend e frontend em paralelo; em push para `main`, build e push das imagens para **ECR** e deploy com `aws ecs update-service --force-new-deployment` nos serviços ECS. Infra inclui **ALB** com regras de roteamento (API vs. frontend), **ElastiCache Redis** para a fila, logs no **CloudWatch**.

**Motivos:**

- ECR + ECS Fargate evita gerir EC2 para containers; escala e deploy rolling ficam no serviço gerenciado.
- Actions integra ao repositório sem Jenkins dedicado.
- Redis gerenciado alinha com BullMQ em produção.

**Pontos positivos:** Pipeline automático na branch principal; imagens versionadas por commit SHA.

**Possíveis drawbacks:** Segredos AWS no GitHub precisam rotação e princípio do menor privilégio; deploy “force new deployment” não valida healthcheck customizado no workflow — melhorias possíveis com CodeDeploy ou checks pós-deploy.

---

## 27. IaC — Terraform

**Decisão:** Terraform (`>= 1.5`) declara ECR, VPC, subnets, security groups, ALB, target groups, ElastiCache, cluster ECS, task definitions, serviços e CloudWatch log groups. Estado remoto S3 está **comentado** como exemplo para evolução.

**Motivos:**

- Infra reprodutível e revisável em PR; variáveis (`jwt_secret`, imagens, e-mail ops) centralizadas.

**Pontos positivos:** Um `terraform apply` (com credenciais) recria o ambiente; documentação viva da arquitetura.

**Possíveis drawbacks:** Estado local ou não configurado dificulta lock e colaboração — o próprio código sugere backend S3. **Nota:** Nesta base, o backend em ECS usa `DATABASE_URL=file:./prod.db` (SQLite no container), **sem RDS** no Terraform — deliberadamente simples para o desafio, com trade-off de persistência efêmera se o task for recriado sem volume externo.

---

## 28. Testes — Jest (backend) e Vitest (frontend)

**Decisão:** Jest no NestJS; Vitest + Testing Library no frontend.

**Motivos:**

- Jest é o padrão oficial do Nest; e2e com Supertest quando configurado.
- Vitest compartilha API com Jest e integra ao Vite; Testing Library prioriza asserções como usuário.

**Pontos positivos:** Feedback rápido no front; mocks e snapshots onde fizer sentido.

**Possíveis drawbacks:** Duas ferramentas de teste no monorepo; configuração duplicada de coverage/tsconfig.

---

## 29. CI — Node 22 e jobs separados

**Decisão:** Workflow único com jobs `backend-tests` e `frontend-tests` (cada um com `npm ci` na pasta correta); build/push/deploy condicionados a `main` e dependências de job.

**Motivos:**

- Falha isolada: quebra no front não impede ver veredito do back antes de consertar.
- `prisma generate` no CI garante que o client gerado é reproduzível.

**Pontos positivos:** Paralelismo nativo do GitHub Actions; cache de npm por lockfile.

**Possíveis drawbacks:** Sem matriz de versões Node (só 22) — suficiente para o projeto atual.

---

*Última atualização: março de 2026 — alinhada ao código e à infraestrutura do repositório.*
