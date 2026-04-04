# Services — FAWedding API

**Path:** `src/services/**/*.ts`

Camada de **regras de negócio** e acesso a dados via Prisma. Não conhece HTTP nem `Context` do Hono.

## Estrutura

- Services são **classes**.
- Devem **estender `AbstractService`** (cliente Prisma, `orgId` e dependências compartilhadas vêm da base).
- Acesso ao banco exclusivamente via **`this.prisma`** (nunca importar um cliente Prisma solto no método).

## Responsabilidade

- **Toda** lógica de negócio que não pertence ao controller.
- **Filtragem por `orgId`:** operações multi-tenant devem restringir dados ao contexto da organização (via `this.orgId` ou equivalente definido em `AbstractService`).
- Regras de domínio: consistência entre entidades, validações que não são só formato de payload HTTP.

## Métodos

- Nomeados por **ação:** `list`, `create`, `update`, `delete` (e outras ações explícitas quando necessário).
- **Retornar dados já transformados** para o contrato da API — via **mapper** (`toXxxResponse`), não devolver tipos crus do Prisma.

## Integração com Prisma

- Preferir chamadas explícitas: **`this.prisma.<model>.<method>`** (`findMany`, `findFirst`, `create`, `update`, etc.).
- Em **`where`**, incluir **`orgId`** quando a entidade for escopo de organização.

## Includes

- Suportar **includes dinâmicos** (objeto de flags ou similar passado pelo controller).
- Tipar entradas de include e busca com **Zod** (`IncludesVenueRequest`, schemas de search, etc.).

## Exemplo obrigatório (`list`)

```ts
export class VenueService extends AbstractService {
  async list(
    search: SearchVenueRequest = {},
    includes: IncludesVenueRequest,
  ): Promise<VenueModelResponse[]> {
    const venues = await this.prisma.venue.findMany({
      where: {
        orgId: this.orgId,
        parentId: search?.parentId,
      },
      include: {
        parent: includes?.parent,
      },
    })
    return venues.map(toVenueResponse)
  }
}
```

## Anti-patterns

- Importar ou receber **`Context` (`c`)** no service.
- Retornar **resultado Prisma cru** sem passar por **mapper** quando o contrato da API for DTO/response tipado.
- Colocar **lógica de negócio** no controller em vez do service.
- **Engolir erro** (`catch` vazio ou retorno `null` sem motivo) quando deveria falhar a requisição.
