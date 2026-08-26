import type { ConfirmationEmailComponent } from './types'
import { FelipeAmandaConfirmationEmail } from './templates/felipe-amanda'
import { GenericConfirmationEmail } from './templates/generic'

const registry: Record<number, ConfirmationEmailComponent> = {
  1: FelipeAmandaConfirmationEmail,
}

export function getConfirmationEmailComponent(weddingId: number): ConfirmationEmailComponent {
  return registry[weddingId] ?? GenericConfirmationEmail
}
