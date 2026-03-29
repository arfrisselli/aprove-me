# Aprove-me — Bankme Challenge

Sistema de gestão de recebíveis e cedentes desenvolvido como teste técnico para a Bankme.

## Sumário

- [Como preparar o ambiente](#como-preparar-o-ambiente)
- [Como instalar as dependências](#como-instalar-as-dependências)
- [Subindo os ambientes](#subindo-os-ambientes)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Rotas da API](#rotas-da-api)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Decisões técnicas](#decisões-técnicas)

---

## Como preparar o ambiente

### Pré-requisitos

| Ferramenta     | Versão mínima |
| -------------- | ------------- |
| Node.js        | 22.x          |
| npm            | 10.x          |
| Docker         | 24.x          |
| Docker Compose | 2.x           |

Para os Níveis 9 e 10 (Cloud + IaC):

- AWS CLI configurado com credenciais válidas
- Terraform >= 1.5

---

## Como instalar as dependências

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

Antes de `npm run start:dev`, suba o **Redis** (e opcionalmente o MailHog) conforme [Subindo os ambientes](#subindo-os-ambientes), senão a API logará erros de conexão na porta 6379.

### Frontend

```bash
cd frontend
npm install
```

---

## Subindo os ambientes

Há duas formas principais. Em ambas, vale lembrar:

- O backend usa **BullMQ** e tenta conectar ao **Redis** na porta configurada (`REDIS_PORT`, padrão `6379`). Sem Redis acessível, a API costuma subir mesmo assim, mas o terminal fica cheio de `ECONNREFUSED` e qualquer fluxo que use fila falha.
- O login `aprovame` / `aprovame` só existe depois do **`npx prisma db seed`** no **mesmo arquivo SQLite** que a API usa (`DATABASE_URL`). Migrações criam tabelas; o seed cria o usuário.

### Stack completa com Docker Compose

Na **raiz** do repositório:

```bash
docker compose up --build
```

O `docker-compose.yaml` sobe os serviços nesta ordem de dependência: **redis** e **mailhog** (com healthcheck) primeiro; em seguida **api** e **frontend**. A API já recebe `REDIS_HOST=redis` e `MAIL_HOST=mailhog`, ou seja, não use `localhost` para Redis ou SMTP dentro do container da API — o Compose define isso por você.

| Serviço  | Porta (host) | Descrição                                              |
| -------- | ------------- | ------------------------------------------------------ |
| api      | 3000          | Backend NestJS                                         |
| frontend | 8080          | Frontend React (Nginx no container escuta na porta 80) |
| redis    | 6379          | Fila BullMQ                                            |
| mailhog  | 8025          | UI de e-mails (desenvolvimento)                        |
| mailhog  | 1025          | SMTP fake                                              |

Após os containers estarem de pé:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Frontend (imagem Docker): `http://localhost:8080` (não é a porta `5173` do Vite local)
- MailHog: `http://localhost:8025`

**Login no Swagger (Compose):** ao iniciar, a API executa `prisma migrate deploy`, mas **a imagem não roda `prisma db seed` automaticamente**. Se `POST /integrations/auth` responder **401** com `aprovame` / `aprovame`, o banco usado pelo container ainda não tem o usuário de teste. Para desenvolvimento no dia a dia, costuma ser mais simples usar o modo **npm + Redis/MailHog no Docker** (seção seguinte), onde você roda o seed uma vez no `dev.db` local.

### Compose Watch

Rebuild automático ao mudar código ou dependências (Docker Compose v2.22+):

```bash
docker compose watch
```

As imagens de `api` e `frontend` são de **produção**; o `develop.watch` usa `action: rebuild` para recompilar a imagem afetada quando arquivos relevantes mudam.

### Desenvolvimento local com npm (recomendado no dia a dia)

**1. Infraestrutura mínima no Docker** (evita erro de Redis e permite e-mail de teste):

```bash
# Na raiz do projeto
docker compose up redis mailhog -d
```

**2. Backend** (outro terminal):

```bash
cd backend
# Crie .env com os valores da seção "Variáveis de ambiente" abaixo
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

**3. Frontend** (outro terminal):

```bash
cd frontend
npm install
npm run dev
```

- API: `http://localhost:3000` · Swagger: `http://localhost:3000/docs`
- Frontend (Vite): `http://localhost:5173`

Se você **não** subir o Redis (passo 1), mantenha ao menos `docker compose up redis -d` para silenciar `ECONNREFUSED 127.0.0.1:6379` e habilitar lotes assíncronos.

### Problemas frequentes

| Sintoma | Causa provável | O que fazer |
| ------- | -------------- | ----------- |
| `ECONNREFUSED` na porta **6379** | Nenhum Redis escutando no host configurado em `REDIS_HOST` / `REDIS_PORT` | Na raiz: `docker compose up redis -d` (ou suba a stack completa com Compose) |
| **401** em `POST /integrations/auth` com `aprovame` / `aprovame` | Tabelas existem, mas não há linha de usuário **no mesmo `DATABASE_URL` da API** | Na pasta `backend`: `npx prisma db seed` (e confira se não está usando `dev.db` local enquanto a API aponta para outro arquivo) |
| E-mail não aparece no dev local | MailHog não está rodando ou `MAIL_HOST` / `MAIL_PORT` incorretos | `docker compose up mailhog -d` e use `MAIL_HOST=localhost`, `MAIL_PORT=1025` no `.env` do backend |

---

## Variáveis de ambiente

Crie um arquivo `.env` na pasta **`backend`** quando for rodar com **`npm run start:dev`** (não é obrigatório commitar; use estes valores como base):

```env
DATABASE_URL="file:./dev.db"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="seu-segredo-aqui"
JWT_EXPIRES_IN="1m"
MAIL_HOST="localhost"
MAIL_PORT=1025
MAIL_FROM="noreply@aprovame.com"
OPS_EMAIL="ops@aprovame.com"
```

Com **Redis** e **MailHog** no Docker (`docker compose up redis mailhog -d`), `REDIS_HOST=localhost` e `MAIL_HOST=localhost` estão corretos porque as portas são publicadas no host. Na **stack Compose completa**, a API recebe `REDIS_HOST=redis` e `MAIL_HOST=mailhog` pelo `docker-compose.yaml`, sem depender deste `.env`.

---

## Rotas da API

### Autenticação

```
POST /integrations/auth
Body: { "login": "aprovame", "password": "aprovame" }
```

Todas as demais rotas exigem o header `Authorization: Bearer <token>`.

### Pagáveis

| Método | Rota                          | Descrição                    |
| ------ | ----------------------------- | ---------------------------- |
| POST   | `/integrations/payable`       | Cria pagável + cedente       |
| GET    | `/integrations/payable`       | Lista todos os pagáveis      |
| GET    | `/integrations/payable/:id`   | Retorna um pagável           |
| PUT    | `/integrations/payable/:id`   | Atualiza um pagável          |
| DELETE | `/integrations/payable/:id`   | Remove um pagável            |
| POST   | `/integrations/payable/batch` | Lote assíncrono (até 10.000) |

**Body do POST /integrations/payable:**

```json
{
  "payable": {
    "id": "uuid-v4",
    "value": 100.5,
    "emissionDate": "2024-01-15",
    "assignor": "uuid-do-cedente"
  },
  "assignor": {
    "id": "uuid-v4",
    "document": "12345678900",
    "email": "cedente@empresa.com",
    "phone": "11999999999",
    "name": "Empresa XYZ Ltda"
  }
}
```

### Cedentes

| Método | Rota                         | Descrição               |
| ------ | ---------------------------- | ----------------------- |
| POST   | `/integrations/assignor`     | Cria um cedente         |
| GET    | `/integrations/assignor`     | Lista todos os cedentes |
| GET    | `/integrations/assignor/:id` | Retorna um cedente      |
| PUT    | `/integrations/assignor/:id` | Atualiza um cedente     |
| DELETE | `/integrations/assignor/:id` | Remove um cedente       |

---

## Testes

### Backend (Jest)

```bash
cd backend
npm test             # roda todos os testes unitários
npm run test:cov     # com cobertura de código
```

### Frontend (Vitest)

```bash
cd frontend
npm test             # roda todos os testes
npm run test:watch   # modo watch
```

---

## Estrutura do projeto

```
aprove-me/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT, guards, estratégias, decorators
│   │   ├── assignor/       # CRUD de cedentes
│   │   ├── payable/
│   │   │   ├── batch/      # Processor BullMQ (fila assíncrona)
│   │   │   └── dto/
│   │   ├── mail/           # Serviço de e-mail (Nodemailer)
│   │   └── prisma/         # PrismaService global
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco
│   │   └── seed.ts         # Seed inicial (usuário "aprovame")
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/          # Login, Payables, Assignors
│   │   ├── components/     # Layout, PrivateRoute
│   │   ├── services/       # auth, payable, assignor (Axios)
│   │   └── types/          # Interfaces TypeScript
│   └── Dockerfile
├── terraform/              # IaC para AWS (ECS, ECR, Redis, ALB)
├── .github/workflows/      # Pipeline CI/CD (GitHub Actions)
├── docker-compose.yaml
└── DECISIONS.md            # Documentação de decisões técnicas
```

---

## Decisões técnicas

Todas as decisões de arquitetura, bibliotecas, padrões e trade-offs estão documentadas em detalhes no arquivo [DECISIONS.md](./DECISIONS.md).
