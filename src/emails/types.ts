import type { ComponentType } from 'react'

export type ConfirmationEmailProps = {
  guestName: string
  wedding: {
    name: string
    date: Date
    siteUrl: string
  }
}

export type ConfirmationEmailComponent = ComponentType<ConfirmationEmailProps>
