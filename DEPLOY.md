# Deploy no Coolify (Hostinger VPS)

## 1. Variáveis de ambiente

No painel do Coolify, adicione estas variáveis ao serviço Next.js:

```
DATABASE_URL=postgresql://USER:SENHA@postgres:5432/circo_game
NEXTAUTH_URL=https://seudomain.com
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

APPLE_ID=...
APPLE_SECRET=...

RESEND_API_KEY=re_...
RESEND_FROM=Circo Game <noreply@seudomain.com>
```

## 2. Banco de dados

No Coolify, crie um serviço PostgreSQL e conecte ao mesmo projeto.
O hostname interno será `postgres` (ou o nome que você definir).

Após o primeiro deploy, rode a migration:

```bash
# No terminal do container Next.js (via Coolify shell)
npx prisma migrate deploy
```

Ou aplique o SQL manualmente:
```bash
psql $DATABASE_URL < prisma/migrations/0001_init/migration.sql
```

## 3. Criar o primeiro admin

Após o primeiro usuário se cadastrar (via OAuth ou email), promova-o a admin direto no banco:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'seu@email.com';
```

## 4. Docker Compose (opcional — para testar local)

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: circo_game
      POSTGRES_USER: circo
      POSTGRES_PASSWORD: senha123
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://circo:senha123@postgres:5432/circo_game
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: dev-secret-32chars-min
    depends_on:
      - postgres

volumes:
  pgdata:
```

## 5. Configurar OAuth

### Google
1. console.cloud.google.com → Credenciais → OAuth 2.0
2. Authorized redirect URI: `https://seudomain.com/api/auth/callback/google`

### Facebook
1. developers.facebook.com → App → Facebook Login
2. Valid OAuth Redirect URI: `https://seudomain.com/api/auth/callback/facebook`

### Apple
1. developer.apple.com → Certificates → Sign in with Apple
2. Redirect URI: `https://seudomain.com/api/auth/callback/apple`
3. Requer conta Apple Developer (US$99/ano)

### Resend
1. resend.com → API Keys → criar chave
2. Verificar domínio em Domains → adicionar DNS records no Hostinger
