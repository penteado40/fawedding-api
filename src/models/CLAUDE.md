# Models — FAWedding API

**Path:** `src/models/**/*.ts`

Tipos de domínio/DTO alinhados aos **schemas Zod** e **mappers** que convertem resultados Prisma no contrato da API. Não substituem services nem schemas; concentram shape TypeScript e transformação de saída.

## Tipagem

- Tipos expostos à API derivam dos schemas com **`z.infer<typeof …>`**, importando o schema canônico de `src/schemas/`.
- Manter **separação explícita**:
  - **Request types** — entrada HTTP já validada (`CreateXRequest`, `SearchXRequest`, `IncludesXRequest`, etc.).
  - **Response types** — payload enviado ao cliente (`XModelResponse`, listas, etc.).
  - **Model types** — alinhados a `XModelSchema` / entidade de domínio na API (não confundir com modelo Prisma cru).

Evitar um único tipo "genérico" que misture request, persistência e response sem distinção.

## Mapper obrigatório

Toda entidade exposta na API deve ter um mapper de saída no padrão **`to{Entity}Response`** (`toVenueResponse`, `toGuestResponse`, …) — uma função por entidade, responsável pelo shape da response.

## Responsabilidade do mapper

- Converter **registro Prisma (+ includes)** → **objeto no formato da response** (campos, nulos, datas serializadas, etc.).
- Tratar **relações** quando vierem no `include`: mapear sub-objetos com o mapper da entidade relacionada.

## Relações

- Tipar o que o Prisma retorna quando há `include`: intersection ou tipo auxiliar (`VenueWithParent`, etc.), em vez de `any`.
- **Não** retornar o objeto Prisma integral como "response"; sempre passar pelo mapper.

## Exemplo obrigatório — `toVenueResponse` com relação recursiva

```ts
import type { Venue as VenueRow } from '@prisma/client'
import type { VenueModelResponse } from '../types' // z.infer<typeof VenueModelSchema>

type VenueWithOptionalParent = VenueRow & {
  parent?: VenueRow | null
}

export function toVenueResponse(venue: VenueWithOptionalParent): VenueModelResponse {
  return {
    id: venue.id,
    name: venue.name,
    parentId: venue.parentId,
    parent:
      venue.parent != null ? toVenueResponse({ ...venue.parent, parent: undefined }) : undefined,
  }
}
```

## Anti-patterns

- Devolver **tipos Prisma crus** no controller ou como "response type" público sem mapper.
- Colocar **lógica de negócio** no mapper (regras de domínio, filtros por `orgId`, etc. ficam no **service**).
