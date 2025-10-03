import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, participantName, eventName, certificateUrl, certificateId } = await request.json()

    console.log("[v0] Sending certificate email to:", to)

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev"

    if (!apiKey) {
      console.log("[v0] No API key found, simulating email send")
      return NextResponse.json({
        success: true,
        emailId: `simulated-${Date.now()}`,
        message: "Email simulated (no API key configured)",
      })
    }

    // Convert SVG to base64 for email attachment
    const certificateBase64 = certificateUrl.split(",")[1]

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `Your Certificate for ${eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Congratulations, ${participantName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for participating in <strong>${eventName}</strong>. 
              Your certificate of participation is attached to this email.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Certificate ID: <code style="background: #f4f4f4; padding: 2px 6px; border-radius: 3px;">${certificateId}</code>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `certificate-${certificateId}.svg`,
            content: certificateBase64,
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Resend API error:", data.message)
      throw new Error(data.message || "Failed to send email")
    }

    console.log("[v0] Email sent successfully:", data.id)

    return NextResponse.json({
      success: true,
      emailId: data.id,
    })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    )
  }
}
