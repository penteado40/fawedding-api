# FAWedding — Email de Confirmação de Presença

---

## Contexto e decisões de arquitetura

> **Nota:** a primeira versão desta PRD especificava uma stack SQS + Lambda + SES. Essa stack chegou a ser implementada e deployada, e depois **desfeita** (infra AWS real destruída via `cdk destroy`) por ser complexidade desnecessária para o volume do projeto — a decisão foi simplificar para envio direto, sem fila. Este documento substitui a versão anterior.

- Envio de email **direto no processo da API**, sem fila, sem Lambda, sem AWS. Provedor: **Resend**.
- A plataforma é multi-tenant (ver PRD de multi-tenancy): cada `Wedding` pode ter frontend e domínio próprios. O template do email e o remetente precisam refletir isso.
- RSVP criado = status `CONFIRMED` imediato (já é o comportamento atual). O email é um **recibo de confirmação**, não um passo de double opt-in.
- Volume esperado: dezenas a poucas centenas de RSVPs por casamento. Sem necessidade de infra assíncrona dedicada.
- Custo: R$ 0 (free tier do Resend cobre o volume esperado).

### Estrutura de pastas

```
fawedding-api/
  src/
    services/
      rsvp.service.ts          # dispara envio após criar o RSVP (fire-and-forget)
    lib/
      email.ts                 # sendConfirmationEmail(...) via Resend
    emails/
      registry.ts              # weddingId -> componente React Email (+ fallback)
      templates/
        felipe-amanda.tsx      # template existente, copiado do frontend
  prisma/
    schema.prisma              # + Wedding.siteUrl, + Rsvp.emailStatus/emailSentAt/emailError
```

As pastas `infra/` e `lambda/` (CDK + handler Lambda) são removidas. A dependência `@aws-sdk/client-sqs` e o arquivo `src/lib/sqs.ts` são removidos.

---

## Enviar email de confirmação ao criar RSVP

### What to build

No `RsvpService.create`, após `prisma.rsvp.create` bem-sucedido, disparar o envio do email como fire-and-forget (`void sendConfirmationEmail(...)`). Falha no envio nunca lança exceção para o caller — o RSVP já foi salvo, e essa é a garantia que importa para o convidado.

`sendConfirmationEmail`:
1. Busca o componente de email correto no registro (`emails/registry.ts`), usando `weddingId`. Se não houver componente dedicado, usa um template genérico de fallback.
2. Deriva o remetente a partir de `Wedding.siteUrl`: `From: noreply@<hostname de siteUrl>`.
3. Chama `resend.emails.send({ from, to: rsvp.email, react: <Componente nome={rsvp.name} /> })` — o SDK do Resend renderiza o componente React diretamente, sem precisar de uma etapa manual de `render()` para HTML.
4. Atualiza o RSVP: sucesso → `emailStatus = SENT`, `emailSentAt = now()`; falha → `emailStatus = FAILED`, `emailError = <mensagem>`.

### Schema (Prisma)

- `Wedding`: novo campo `siteUrl` (String) — URL pública do site daquele casamento. Usado tanto para o link do CTA no email quanto para derivar o domínio do remetente.
- `Rsvp`: novos campos `emailStatus` (enum `PENDING` | `SENT` | `FAILED`, default `PENDING`), `emailSentAt` (DateTime, nullable), `emailError` (String, nullable).

### Template por casamento

Cada `Wedding` pode ter um componente React Email dedicado (cópia do template mantido no respectivo frontend — frontend é a fonte da verdade visual, duplicação aceita, sem sincronização automática). Um template genérico serve de fallback para casamentos sem componente próprio ainda.

Na prática, todo o markup (fontes, seção de hero, cards de data/horário/local, CTA, footer) vive num único componente compartilhado, `ConfirmationEmailLayout` (em `emails/templates/generic.tsx`). O template de cada casamento é só esse layout configurado com paleta de cores, foto de hero e textos — normalmente algumas dezenas de linhas. `GenericConfirmationEmail` (o fallback do registry) é o mesmo layout com paleta neutra e sem foto/local, já que o `Wedding` não guarda esses dados. Um casamento novo nunca duplica HTML/CSS — só adiciona um arquivo de configuração e registra em `emails/registry.ts`.

### Remetente e domínio

Cada domínio de casamento (extraído de `siteUrl`) precisa estar verificado no Resend (registros DNS TXT + CNAMEs DKIM adicionados manualmente no Cloudflare daquele domínio). Passo manual, por casamento, fora do escopo automatizável.

### Acceptance criteria

- [ ] Após salvar RSVP no banco, o email de confirmação é enviado via Resend
- [ ] Componente de email correto é escolhido a partir do `weddingId`; fallback genérico é usado quando não há componente dedicado
- [ ] Remetente é `noreply@<hostname de Wedding.siteUrl>`
- [ ] Falha no envio é logada e gravada em `emailError`, mas nunca impede a criação do RSVP nem falha o response HTTP
- [ ] `emailStatus` e `emailSentAt` são atualizados corretamente após a tentativa de envio
- [ ] Migration adiciona `Wedding.siteUrl` e os três novos campos em `Rsvp`

---

## Reenvio manual e preview

### What to build

**Reenvio manual** — nova rota `POST /weddings/:weddingId/rsvps/:id/resend-email`. Chama a mesma função `sendConfirmationEmail`, permitindo reenviar tanto RSVPs com `emailStatus = FAILED` quanto qualquer outro RSVP, sob demanda. Mesmo controle de acesso das demais rotas de wedding (`assertCanAccessWedding`). Sem retry automático — reprocessamento é sempre uma ação explícita de quem gerencia o casamento.

**Preview de email** — nova rota dev-only `GET /weddings/:weddingId/rsvps/email-preview`, renderiza o componente do casamento correspondente com dados mockados, direto no browser. Substitui a rota `/email-preview` que estava planejada na Landing Page — faz mais sentido centralizada aqui agora que existe mais de um template (um por casamento).

### Acceptance criteria

- [ ] `POST /weddings/:weddingId/rsvps/:id/resend-email` reenvia o email e atualiza `emailStatus`/`emailSentAt`/`emailError`
- [ ] Rota de resend segue o mesmo controle de acesso das demais rotas de wedding
- [ ] `GET /weddings/:weddingId/rsvps/email-preview` renderiza o template correto daquele casamento com dados mockados
- [ ] Rota de preview não requer um RSVP real nem envia email de verdade

---

## Testing Decisions

Um bom teste verifica comportamento externo e contratos — não detalhes de implementação internos.

**Registro de templates:** testar que, dado um `weddingId` com componente registrado, o componente certo é escolhido; e que um `weddingId` sem componente cai no fallback.

**Envio de email:** mockar o cliente Resend — testar que, dado um RSVP criado com sucesso, o envio é chamado com remetente e destinatário corretos. Testar que falha no envio não lança exceção para o caller e resulta em `emailStatus = FAILED` + `emailError` preenchido.

**Reenvio manual:** testar que a rota de resend chama o envio novamente e atualiza o status corretamente.

---

## Out of Scope

- Envio de email em outros eventos além da criação de RSVP (ex.: atualização de status, cancelamento)
- Email para o casal notificando novo RSVP
- Template de email para lista de presentes
- Painel de monitoramento de emails enviados
- Retry automático de envio (reenvio é sempre manual, via rota dedicada)
- Verificação de domínio no Resend por casamento (recomendada mas manual, fora do escopo automatizável)
- Internacionalização do template
- Fila/processamento assíncrono de qualquer tipo (decisão explícita de simplificação em relação à versão anterior desta PRD)
