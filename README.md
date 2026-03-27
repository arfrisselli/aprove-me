# Aprove-me — Bankme Challenge

Sistema de gestão de recebíveis e cedentes desenvolvido como teste técnico para a Bankme.

## Sumário

- [Como preparar o ambiente](#como-preparar-o-ambiente)
- [Como instalar as dependências](#como-instalar-as-dependências)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Rodando com Docker](#rodando-com-docker)
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

### Frontend

```bash
cd frontend
npm install
```

---

## Como rodar o projeto

### Modo desenvolvimento (sem Docker)

**Backend:**

```bash
# Na pasta /backend
cp .env.example .env   # ajuste as variáveis se necessário
npm run start:dev
```

A API estará disponível em `http://localhost:3000`  
Swagger/OpenAPI em `http://localhost:3000/docs`

**Nota:** Para o processamento de lotes (Nível 7+) é necessário ter o Redis rodando localmente ou via Docker.

**Frontend:**

```bash
# Na pasta /frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

---

## Rodando com Docker

O `docker-compose.yaml` na raiz sobe todos os serviços necessários:

| Serviço  | Porta | Descrição                   |
| -------- | ----- | --------------------------- |
| api      | 3000  | Backend NestJS              |
| frontend | 80    | Frontend React via Nginx    |
| redis    | 6379  | Fila BullMQ                 |
| mailhog  | 8025  | UI de e-mails (development) |
| mailhog  | 1025  | SMTP fake                   |

```bash
# Na raiz do projeto
docker compose up --build
```

Após subir:

- API: `http://localhost:3000`
- Frontend: `http://localhost:80`
- Swagger: `http://localhost:3000/docs`
- MailHog UI: `http://localhost:8025`

---

## Variáveis de ambiente

Crie um arquivo `.env` em `/backend` baseado nos valores abaixo:

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
