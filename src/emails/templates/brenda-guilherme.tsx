import type { ConfirmationEmailProps } from '../types'
import { ConfirmationEmailLayout } from './generic'

const PALETTE = {
  background: '#f4ebdd',
  cardBackground: '#FFFFFF',
  infoCardBackground: '#e8d6b9',
  textPrimary: '#2b241c',
  textMuted: '#6b5d4f',
  textFooter: '#e2cead',
  cta: '#e87518',
}

export function BrendaGuilhermeConfirmationEmail({ guestName, wedding }: ConfirmationEmailProps) {
  return (
    <ConfirmationEmailLayout
      guestName={guestName}
      coupleNames="Brenda & Guilherme"
      dateLabel="20 de Setembro de 2026"
      weekdayLabel="Domingo"
      timeLabel="11h00"
      cityLabel="São Paulo"
      venueName="Av. Otto Baumgart, 500 - Loja 121 B"
      venueSubtitle="Vila Guilherme, São Paulo"
      mapsUrl="https://www.google.com/maps/search/?api=1&query=Av.+Otto+Baumgart+500+Vila+Guilherme+Sao+Paulo"
      siteUrl={wedding.siteUrl}
      heroImageUrl={`${wedding.siteUrl}/email-assets/hero.jpg`}
      palette={PALETTE}
    />
  )
}
