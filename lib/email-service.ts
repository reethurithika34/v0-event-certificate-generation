export async function sendCertificateEmail(
  participant: {
    email: string
    name: string
    formattedName?: string
    certificateUrl: string
    certificateId: string
  },
  event: {
    eventName: string
  },
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const response = await fetch("/api/send-certificate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: participant.email,
        participantName: participant.formattedName || participant.name,
        eventName: event.eventName,
        certificateUrl: participant.certificateUrl,
        certificateId: participant.certificateId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email")
    }

    return {
      success: true,
      emailId: data.emailId,
    }
  } catch (error) {
    console.error("[v0] Email service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

export async function sendBulkCertificates(
  participants: Array<{
    id: string
    email: string
    name: string
    formattedName?: string
    certificateUrl: string
    certificateId: string
  }>,
  event: {
    eventName: string
  },
  onProgress?: (completed: number, total: number) => void,
): Promise<
  Array<{
    participantId: string
    success: boolean
    emailId?: string
    error?: string
  }>
> {
  const results = []

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const result = await sendCertificateEmail(participant, event)

    results.push({
      participantId: participant.id,
      ...result,
    })

    if (onProgress) {
      onProgress(i + 1, participants.length)
    }

    // Add a small delay to avoid rate limiting
    if (i < participants.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}

export async function sendAllCertificatesToOwner(
  ownerEmail: string,
  participants: Array<{
    id: string
    email: string
    name: string
    formattedName?: string
    certificateUrl: string
    certificateId: string
  }>,
  event: {
    eventName: string
  },
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const response = await fetch("/api/send-bulk-to-owner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerEmail,
        eventName: event.eventName,
        certificates: participants.map((p) => ({
          participantName: p.formattedName || p.name,
          participantEmail: p.email,
          certificateUrl: p.certificateUrl,
          certificateId: p.certificateId,
        })),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email")
    }

    return {
      success: true,
      emailId: data.emailId,
    }
  } catch (error) {
    console.error("[v0] Email service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}
