import type { ConfirmationEmailComponent } from './types'
import { FelipeAmandaConfirmationEmail } from './templates/felipe-amanda'
import { BrendaGuilhermeConfirmationEmail } from './templates/brenda-guilherme'
import { GenericConfirmationEmail } from './templates/generic'

const registry: Record<number, ConfirmationEmailComponent> = {
  1: FelipeAmandaConfirmationEmail,
  2: BrendaGuilhermeConfirmationEmail,
}

export function getConfirmationEmailComponent(weddingId: number): ConfirmationEmailComponent {
  return registry[weddingId] ?? GenericConfirmationEmail
}
