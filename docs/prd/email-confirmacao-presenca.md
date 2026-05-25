# FAWedding — Email de Confirmação de Presença

Epic: **PROJ-39 — FAWedding**
Projeto: **PROJ (Projects)**

---

## Contexto e decisões de arquitetura

- Stack de email usa **SQS + Lambda + SES intencionalmente para portfólio/aprendizado** — não por necessidade técnica (volume esperado: ~200 RSVPs).
- Toda a infra nova vive neste repo: `infra/` (CDK) e `lambda/` (handler + template).
- RSVP criado = status **CONFIRMED** imediato. O email é um **recibo de confirmação**, não double opt-in.
- Região AWS: **us-east-1**. Custo estimado: **R$ 0** (dentro do free tier da AWS).
- Remetente: `noreply@fawedding.com.br` (domínio `fawedding.com.br` gerenciado no Cloudflare).
- Template React Email já existe no frontend repo com prop `{ name: string }` — será duplicado em `lambda/src/email/confirmation.tsx` (duplicação aceita explicitamente).
- Payload SQS: `{ name: string, email: string }` — `phone` não é necessário para o template.

### Estrutura de pastas

```
fawedding-api/
  src/                          # API Hono (existente)
  prisma/                       # existente
  infra/                        # CDK stack (SQS, SES, Lambda, IAM, DLQ)
  lambda/
    src/
      handler.ts                # entry point do Lambda
      email/
        confirmation.tsx        # template React Email (copiado do frontend)
```

---

## PROJ-41 — Configurar infraestrutura AWS (SQS + SES + Lambda) via CDK

**Tipo:** História | **HITL**
**Bloqueado por:** nenhum

### What to build

Provisionar via AWS CDK (TypeScript) em `infra/` os recursos AWS necessários:

- Fila SQS principal para receber eventos de confirmação
- **Dead Letter Queue (DLQ)** com `maxReceiveCount: 3` — após 3 falhas, mensagem vai para a DLQ
- Configuração do domínio `fawedding.com.br` no AWS SES (`CfnEmailIdentity`) — gera registros TXT + 3 CNAMEs DKIM para adicionar manualmente no Cloudflare
- Função Lambda com trigger nativo na fila SQS
- IAM roles com menor privilégio (Lambda → SES, SQS → Lambda)
- Output do CDK com ARN/URL da fila SQS para uso na API

**SES Sandbox:** por padrão a conta AWS começa em sandbox. Para testes, verificar emails individuais via CLI:

```bash
aws ses verify-email-identity --email-address email@exemplo.com --region us-east-1
```

Para o evento real, solicitar saída do sandbox via AWS Support (formulário + 24–72h de aprovação).

### Acceptance criteria

- [ ] CDK stack provisiona SQS, DLQ e Lambda sem erros
- [ ] DLQ configurada com `maxReceiveCount: 3`
- [ ] Domínio `fawedding.com.br` com identidade criada no SES
- [ ] Registros DNS (TXT + 3 CNAMEs DKIM) adicionados no Cloudflare e domínio verificado
- [ ] Lambda triggerada ao receber mensagem na fila SQS
- [ ] IAM roles seguem princípio do menor privilégio
- [ ] URL da fila SQS disponível como output do CDK
- [ ] Emails de teste verificados via CLI para uso no sandbox

---

## PROJ-42 — Criar template de email de confirmação de presença com React Email

**Tipo:** História | **AFK**
**Bloqueado por:** nenhum

### What to build

Copiar o componente React Email existente no repositório do frontend para `lambda/src/email/confirmation.tsx`. O componente já usa `@react-email/components` e já tem prop `{ name: string }`. Ajustar tipagem e exportar função `renderEmailHtml`.

> Nota: duplicação aceita — o frontend é a fonte da verdade visual; `lambda/` mantém cópia para uso no handler.

### Acceptance criteria

- [ ] Componente em `lambda/src/email/confirmation.tsx` com prop `{ name: string }` tipada
- [ ] Função `renderEmailHtml(data: { name: string }): string` exportada
- [ ] Template renderiza corretamente em Gmail e Outlook

---

## PROJ-43 — Publicar mensagem no SQS ao salvar confirmação de presença na API

**Tipo:** História | **AFK**
**Bloqueado por:** PROJ-41

### What to build

No `RsvpService.create` (após `prisma.rsvp.create` com sucesso), publicar mensagem na fila SQS com payload `{ name, email }`. Implementar como fire-and-forget — falha no SQS não bloqueia o response do convidado.

O schema do payload deve ser validado com Zod.

### Payload

```ts
{ name: string, email: string }
```

### Acceptance criteria

- [ ] Após salvar RSVP no banco, mensagem é publicada no SQS
- [ ] Payload contém `name` e `email` do convidado
- [ ] `SQS_QUEUE_URL` configurado como variável de ambiente no Render
- [ ] Falha no SQS é logada mas não bloqueia o convidado (fire-and-forget)
- [ ] Payload validado com Zod antes do envio
- [ ] `rsvp.controller.ts`: description corrigido de "status PENDING" para "status CONFIRMED"

---

## PROJ-44 — Implementar Lambda handler que consome SQS e envia email via SES

**Tipo:** História | **AFK**
**Bloqueado por:** PROJ-41, PROJ-42

### What to build

Implementar `lambda/src/handler.ts` que:

1. Recebe evento SQS com records `{ name, email }`
2. Faz parse e valida o payload com Zod
3. Renderiza o HTML via `renderEmailHtml({ name })`
4. Envia via SES com `from: noreply@fawedding.com.br`
5. Processa cada record independentemente — falha num record não trava os demais

### Acceptance criteria

- [ ] Handler processa evento SQS com `{ name, email }` corretamente
- [ ] Email enviado via SES com `from: noreply@fawedding.com.br`
- [ ] Subject e corpo do email corretos
- [ ] Erros por record são logados sem travar o processamento dos demais
- [ ] Variáveis de ambiente validadas na inicialização do handler
- [ ] Mensagens com falha após 3 tentativas chegam na DLQ

---

## PROJ-45 — Adicionar rota de preview do email na Landing Page

**Tipo:** História | **AFK**
**Bloqueado por:** PROJ-42

### What to build

Adicionar rota `/email-preview` no projeto Vite React da Landing Page que renderiza o componente React Email com dados mockados. Rota não aparece na navegação principal.

### Acceptance criteria

- [ ] Rota `/email-preview` acessível na LP renderiza o template com dados mockados
- [ ] Layout fiel ao email que o convidado recebe
- [ ] Rota não aparece na navegação principal

---

## PROJ-46 — Validar fluxo end-to-end

**Tipo:** História | **HITL**
**Bloqueado por:** PROJ-43, PROJ-44, PROJ-45

### What to build

Validar o fluxo completo em ambiente real: formulário na LP → API salva e publica no SQS → Lambda triggerada → email de confirmação recebido.

### Acceptance criteria

- [ ] Formulário submetido resulta em email recebido pelo convidado
- [ ] Email chega com remetente `noreply@fawedding.com.br`
- [ ] Email não cai em spam (DKIM configurado)
- [ ] Latência entre submit e recebimento do email < 30s
- [ ] Logs do Lambda visíveis no CloudWatch
- [ ] Mensagens com falha visíveis na DLQ

---

## Diagrama de dependências

```
PROJ-41 (Infra AWS CDK)     PROJ-42 (React Email template)
        │                           │
        ├──────────┐       ┌────────┤
        │          ▼       ▼        │
        │     PROJ-44           PROJ-45
  PROJ-43   (Lambda handler)  (Preview LP)
        │          │               │
        └────────┬─┘               │
                 ▼                 │
             PROJ-46 ◄─────────────┘
          (E2E validation)
```
