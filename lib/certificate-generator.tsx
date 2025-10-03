import type { Participant, Event } from "./types"

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `CERT-${timestamp}-${random}`.toUpperCase()
}

export function generateQRCodeData(certificateId: string, participantEmail: string): string {
  // Generate verification data for QR code
  const verificationData = {
    certificateId,
    email: participantEmail,
    timestamp: new Date().toISOString(),
    issuer: "EventEye",
  }

  return JSON.stringify(verificationData)
}

export async function generateCertificateSVG(participant: Participant, event: Event): Promise<string> {
  const certificateId = participant.certificateId || generateCertificateId()
  const qrCodeData = generateQRCodeData(certificateId, participant.email)

  // Generate QR code SVG (simplified version)
  const qrSize = 100
  const qrCode = `<rect x="0" y="0" width="${qrSize}" height="${qrSize}" fill="white"/>
    <rect x="10" y="10" width="80" height="80" fill="black"/>
    <rect x="20" y="20" width="60" height="60" fill="white"/>
    <text x="50" y="55" text-anchor="middle" font-size="8" fill="black">QR</text>`

  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
       Background 
      <rect width="800" height="600" fill="#ffffff"/>
      
       Border 
      <rect x="20" y="20" width="760" height="560" fill="none" stroke="#2563eb" stroke-width="3"/>
      <rect x="30" y="30" width="740" height="540" fill="none" stroke="#2563eb" stroke-width="1"/>
      
       Header 
      <text x="400" y="100" text-anchor="middle" font-size="36" font-weight="bold" fill="#1e40af">
        CERTIFICATE OF PARTICIPATION
      </text>
      
       Divider 
      <line x1="200" y1="130" x2="600" y2="130" stroke="#2563eb" stroke-width="2"/>
      
       Body 
      <text x="400" y="180" text-anchor="middle" font-size="18" fill="#374151">
        This is to certify that
      </text>
      
      <text x="400" y="240" text-anchor="middle" font-size="32" font-weight="bold" fill="#1e40af">
        ${participant.formattedName || participant.name}
      </text>
      
      <text x="400" y="290" text-anchor="middle" font-size="18" fill="#374151">
        has successfully participated in
      </text>
      
      <text x="400" y="340" text-anchor="middle" font-size="24" font-weight="600" fill="#1e40af">
        ${event.eventName}
      </text>
      
      <text x="400" y="380" text-anchor="middle" font-size="16" fill="#6b7280">
        held on ${new Date(event.eventDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </text>
      
       Organizer Info 
      <text x="150" y="480" text-anchor="start" font-size="14" font-weight="600" fill="#374151">
        ${event.organizerName}
      </text>
      <text x="150" y="500" text-anchor="start" font-size="12" fill="#6b7280">
        ${event.organizerTitle || "Event Organizer"}
      </text>
      ${event.organizerOrganization ? `<text x="150" y="515" text-anchor="start" font-size="12" fill="#6b7280">${event.organizerOrganization}</text>` : ""}
      
       QR Code 
      <g transform="translate(650, 450)">
        ${qrCode}
      </g>
      
       Certificate ID 
      <text x="400" y="550" text-anchor="middle" font-size="10" fill="#9ca3af">
        Certificate ID: ${certificateId}
      </text>
    </svg>
  `

  return svg
}

export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml,${encoded}`
}
