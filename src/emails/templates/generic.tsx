import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
  Font,
  Preview,
} from '@react-email/components'
import type { ConfirmationEmailProps } from '../types'

export type ConfirmationEmailPalette = {
  background: string
  cardBackground: string
  infoCardBackground: string
  textPrimary: string
  textMuted: string
  textFooter: string
  cta: string
}

export type ConfirmationEmailLayoutProps = {
  guestName: string
  coupleNames: string
  dateLabel: string
  cityLabel?: string
  weekdayLabel?: string
  timeLabel?: string
  venueName?: string
  venueSubtitle?: string
  mapsUrl?: string
  siteUrl: string
  heroImageUrl?: string
  palette: ConfirmationEmailPalette
}

// Shared visual shell for every wedding's confirmation email — the parts that
// stay identical across weddings (fonts, structure, copy). Each wedding's own
// template (e.g. felipe-amanda.tsx) is just this layout configured with its
// palette, hero photo, and wedding details. GenericConfirmationEmail below is
// the same layout with neutral defaults, used when no dedicated template is
// registered for a weddingId.
export function ConfirmationEmailLayout({
  guestName,
  coupleNames,
  dateLabel,
  cityLabel,
  weekdayLabel,
  timeLabel,
  venueName,
  venueSubtitle,
  mapsUrl,
  siteUrl,
  heroImageUrl,
  palette,
}: ConfirmationEmailLayoutProps) {
  const subline = cityLabel ? `${dateLabel} · ${cityLabel}` : dateLabel
  const showInfoCards = Boolean(timeLabel && venueName)

  const locationCard = (
    <Section style={{ backgroundColor: palette.infoCardBackground, borderRadius: '14px', padding: '18px 16px', textAlign: 'left' }}>
      <Text style={{ fontSize: '20px', margin: '0 0 10px' }}>📍</Text>
      <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.textMuted, margin: '0 0 3px' }}>Local</Text>
      <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: '18px', color: palette.textPrimary, margin: '0 0 3px', lineHeight: '1.2' }}>{venueName}</Text>
      {venueSubtitle ? (
        <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '12px', color: palette.textMuted, margin: '0' }}>{venueSubtitle}</Text>
      ) : null}
    </Section>
  )

  return (
    <Html lang="pt-BR">
      <Head>
        <Font
          fontFamily="Cormorant Garamond"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3YmX5slCNuHLi8bLeY9MK7whpDGERL.woff2',
            format: 'woff2',
          }}
          fontWeight={300}
          fontStyle="normal"
        />
        <Font
          fontFamily="Jost"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/jost/v18/92zPtBhPNqw79Ij1E865zBUv7myjJAVGPokMmuTl.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>Presença Confirmada — {coupleNames} · {dateLabel}</Preview>

      <Body style={{ margin: 0, padding: 0, backgroundColor: palette.background, fontFamily: "'Jost', Arial, sans-serif" }}>
        <Container style={{ maxWidth: '600px', margin: '40px auto', padding: '0 16px' }}>
          <Section style={{ backgroundColor: palette.cardBackground, borderRadius: '20px', overflow: 'hidden' }}>
            <Section
              style={
                heroImageUrl
                  ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center center' }
                  : { backgroundColor: palette.cta }
              }
            >
              <Row>
                <Column
                  style={{
                    backgroundColor: heroImageUrl ? 'rgba(0,0,0,0.52)' : 'transparent',
                    padding: '52px 40px 48px',
                    textAlign: 'center',
                  }}
                >
                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.80)', margin: '0 0 20px' }}>
                    ♥ &nbsp; Presença Confirmada
                  </Text>

                  <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: '52px', fontWeight: 300, color: '#FFFFFF', margin: '0 0 4px', letterSpacing: '0.04em', lineHeight: '1.1' }}>
                    {coupleNames}
                  </Text>

                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', margin: '16px 0 24px' }}>
                    {subline}
                  </Text>

                  <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: '28px', fontWeight: 300, color: '#FFFFFF', margin: '0 0 8px', lineHeight: '1.3', textAlign: 'center' }}>
                    Obrigado, <em style={{ fontStyle: 'italic' }}>{guestName}</em>!
                  </Text>

                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.65', margin: '0', textAlign: 'center' }}>
                    Sua presença foi confirmada. Mal podemos esperar para celebrar esse momento especial com você.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section style={{ backgroundColor: palette.cardBackground, padding: '32px 40px 36px' }}>
              {showInfoCards ? (
                <Row>
                  <Column style={{ paddingRight: '6px' }}>
                    <Section style={{ backgroundColor: palette.infoCardBackground, borderRadius: '14px', padding: '18px 16px', textAlign: 'left' }}>
                      <Text style={{ fontSize: '20px', margin: '0 0 10px' }}>📅</Text>
                      <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.textMuted, margin: '0 0 3px' }}>Data</Text>
                      <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: '18px', color: palette.textPrimary, margin: '0 0 3px', lineHeight: '1.2' }}>{dateLabel}</Text>
                      {weekdayLabel ? (
                        <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '12px', color: palette.textMuted, margin: '0' }}>{weekdayLabel}</Text>
                      ) : null}
                    </Section>
                  </Column>

                  <Column style={{ paddingLeft: '3px', paddingRight: '3px' }}>
                    <Section style={{ backgroundColor: palette.infoCardBackground, borderRadius: '14px', padding: '18px 16px', textAlign: 'left' }}>
                      <Text style={{ fontSize: '20px', margin: '0 0 10px' }}>🕘</Text>
                      <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.textMuted, margin: '0 0 3px' }}>Horário</Text>
                      <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: '18px', color: palette.textPrimary, margin: '0 0 3px', lineHeight: '1.2' }}>{timeLabel}</Text>
                      <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '12px', color: palette.textMuted, margin: '0' }}>Início da cerimônia</Text>
                    </Section>
                  </Column>

                  <Column style={{ paddingLeft: '6px' }}>
                    {mapsUrl ? (
                      <Link href={mapsUrl} style={{ textDecoration: 'none', display: 'block' }}>
                        {locationCard}
                      </Link>
                    ) : (
                      locationCard
                    )}
                  </Column>
                </Row>
              ) : null}

              <Row style={{ marginTop: showInfoCards ? '28px' : '0' }}>
                <Column style={{ textAlign: 'center' }}>
                  <Link
                    href={siteUrl}
                    style={{ display: 'inline-block', padding: '14px 36px', backgroundColor: palette.cta, color: '#FFFFFF', fontFamily: "'Jost', Arial, sans-serif", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '100px', fontWeight: 400 }}
                  >
                    Ver o site do casamento
                  </Link>
                </Column>
              </Row>
            </Section>

            <Hr style={{ borderColor: palette.background, margin: '0' }} />
            <Section style={{ padding: '20px 40px 28px', textAlign: 'center' }}>
              <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: '11px', color: palette.textFooter, letterSpacing: '0.05em', margin: '0' }}>
                {coupleNames} · {dateLabel}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const DEFAULT_PALETTE: ConfirmationEmailPalette = {
  background: '#F5F5F4',
  cardBackground: '#FFFFFF',
  infoCardBackground: '#F5F5F4',
  textPrimary: '#292524',
  textMuted: '#78716C',
  textFooter: '#A8A29E',
  cta: '#292524',
}

// Fallback used by the registry when a wedding has no dedicated template yet —
// same shared layout, neutral colors, no hero photo or venue details (the
// Wedding model doesn't carry that data).
export function GenericConfirmationEmail({ guestName, wedding }: ConfirmationEmailProps) {
  const dateLabel = wedding.date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <ConfirmationEmailLayout
      guestName={guestName}
      coupleNames={wedding.name}
      dateLabel={dateLabel}
      siteUrl={wedding.siteUrl}
      palette={DEFAULT_PALETTE}
    />
  )
}
