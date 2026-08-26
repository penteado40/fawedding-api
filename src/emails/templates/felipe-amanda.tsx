import type { ConfirmationEmailProps } from '../types'
import { ConfirmationEmailLayout } from './generic'

const PALETTE = {
  background: '#F0EBE5',
  cardBackground: '#FFFFFF',
  infoCardBackground: '#F8FAFA',
  textPrimary: '#453A30',
  textMuted: '#9B9390',
  textFooter: '#C8C0BA',
  cta: '#9EBEBF',
}

export function FelipeAmandaConfirmationEmail({ guestName, wedding }: ConfirmationEmailProps) {
  return (
    <ConfirmationEmailLayout
      guestName={guestName}
      coupleNames="Felipe & Amanda"
      dateLabel="28 de Maio de 2026"
      weekdayLabel="Quinta-feira"
      timeLabel="09h30"
      cityLabel="São Paulo"
      venueName="Casa Vilella — Itatiba"
      venueSubtitle="Itatiba, São Paulo"
      mapsUrl="https://maps.app.goo.gl/FKq68fjEvyphQqEv6?g_st=ic"
      siteUrl={wedding.siteUrl}
      heroImageUrl={`${wedding.siteUrl}/email-assets/hero.jpg`}
      palette={PALETTE}
    />
  )
}
