import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Img,
  Link,
  Hr,
  Font,
  Preview,
} from "@react-email/components";
import { render } from "@react-email/render";

export interface ConfirmationEmailProps {
  nome?: string;
  siteUrl?: string;
}

export const ConfirmationEmail = ({
  nome = "Convidado",
  siteUrl = "https://penteado40.github.io/fawedding",
}: ConfirmationEmailProps) => (
  <Html lang="pt-BR">
    <Head>
      <Font
        fontFamily="Cormorant Garamond"
        fallbackFontFamily="Georgia"
        webFont={{
          url: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3YmX5slCNuHLi8bLeY9MK7whpDGERL.woff2",
          format: "woff2",
        }}
        fontWeight={300}
        fontStyle="normal"
      />
      <Font
        fontFamily="Jost"
        fallbackFontFamily="Arial"
        webFont={{
          url: "https://fonts.gstatic.com/s/jost/v18/92zPtBhPNqw79Ij1E865zBUv7myjJAVGPokMmuTl.woff2",
          format: "woff2",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>

    <Preview>Presença Confirmada — Felipe &amp; Amanda · 28 de Maio de 2026</Preview>

    <Body style={{ margin: 0, padding: 0, backgroundColor: "#F0EBE5", fontFamily: "'Jost', Arial, sans-serif" }}>
      <Container style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>

        {/* Card */}
        <Section style={{ backgroundColor: "#FFFFFF", borderRadius: "20px", overflow: "hidden" }}>

          {/* Hero — photo background with dark overlay */}
          <Section
            style={{
              backgroundImage: `url(${siteUrl}/email-assets/hero.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          >
            <Row>
              <Column
                style={{
                  backgroundColor: "rgba(0,0,0,0.52)",
                  padding: "52px 40px 48px",
                  textAlign: "center",
                }}
              >
                <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.80)", margin: "0 0 20px" }}>
                  ♥ &nbsp; Presença Confirmada
                </Text>

                <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: "52px", fontWeight: 300, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "0.04em", lineHeight: "1.1" }}>
                  Felipe &amp; Amanda
                </Text>

                <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", margin: "16px 0 24px" }}>
                  28 de Maio de 2026 &nbsp;·&nbsp; São Paulo
                </Text>

                <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: "28px", fontWeight: 300, color: "#FFFFFF", margin: "0 0 8px", lineHeight: "1.3", textAlign: "center" }}>
                  Obo, <em style={{ fontStyle: "italic" }}>{nome}</em>!
                </Text>

                <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.65", margin: "0", textAlign: "center" }}>
                  Sua presença foi confirmada. Mal podemos esperar para celebrar esse momento especial com você.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Info cards */}
          <Section style={{ backgroundColor: "#FFFFFF", padding: "32px 40px 36px" }}>
            <Row>
              <Column style={{ paddingRight: "6px" }}>
                <Section style={{ backgroundColor: "#F8FAFA", borderRadius: "14px", padding: "18px 16px", textAlign: "left" }}>
                  <Text style={{ fontSize: "20px", margin: "0 0 10px" }}>📅</Text>
                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9B9390", margin: "0 0 3px" }}>Data</Text>
                  <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: "18px", color: "#453A30", margin: "0 0 3px", lineHeight: "1.2" }}>28 de Maio de 2026</Text>
                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "12px", color: "#9B9390", margin: "0" }}>Quinta-feira</Text>
                </Section>
              </Column>

              <Column style={{ paddingLeft: "3px", paddingRight: "3px" }}>
                <Section style={{ backgroundColor: "#F8FAFA", borderRadius: "14px", padding: "18px 16px", textAlign: "left" }}>
                  <Text style={{ fontSize: "20px", margin: "0 0 10px" }}>🕘</Text>
                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9B9390", margin: "0 0 3px" }}>Horário</Text>
                  <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: "18px", color: "#453A30", margin: "0 0 3px", lineHeight: "1.2" }}>09h30</Text>
                  <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "12px", color: "#9B9390", margin: "0" }}>Início da cerimônia</Text>
                </Section>
              </Column>

              <Column style={{ paddingLeft: "6px" }}>
                <Link href="https://maps.app.goo.gl/FKq68fjEvyphQqEv6?g_st=ic" style={{ textDecoration: "none", display: "block" }}>
                  <Section style={{ backgroundColor: "#F8FAFA", borderRadius: "14px", padding: "18px 16px", textAlign: "left" }}>
                    <Text style={{ fontSize: "20px", margin: "0 0 10px" }}>📍</Text>
                    <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9B9390", margin: "0 0 3px" }}>Local</Text>
                    <Text style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", fontSize: "18px", color: "#453A30", margin: "0 0 3px", lineHeight: "1.2" }}>Casa Vilella — Itatiba</Text>
                    <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "12px", color: "#9B9390", margin: "0" }}>Itatiba, São Paulo</Text>
                  </Section>
                </Link>
              </Column>
            </Row>

            {/* CTA */}
            <Row style={{ marginTop: "28px" }}>
              <Column style={{ textAlign: "center" }}>
                <Link
                  href={siteUrl}
                  style={{ display: "inline-block", padding: "14px 36px", backgroundColor: "#9EBEBF", color: "#FFFFFF", fontFamily: "'Jost', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", textDecoration: "none", borderRadius: "100px", fontWeight: 400 }}
                >
                  Ver o site do casamento
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: "#F0EBE5", margin: "0" }} />
          <Section style={{ padding: "20px 40px 28px", textAlign: "center" }}>
            <Text style={{ fontFamily: "'Jost', Arial, sans-serif", fontSize: "11px", color: "#C8C0BA", letterSpacing: "0.05em", margin: "0" }}>
              Felipe &amp; Amanda · 28 de Maio de 2026
            </Text>
          </Section>

        </Section>
      </Container>
    </Body>
  </Html>
);

export async function renderEmailHtml(data: { name: string }): Promise<string> {
  return render(<ConfirmationEmail nome={data.name} />);
}

export default ConfirmationEmail;
