import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { ownerEmail, eventName, certificates } = await request.json()

    console.log("[v0] Sending bulk certificates to owner:", ownerEmail)

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

    // Prepare attachments for all certificates
    const attachments = certificates.map(
      (cert: { certificateUrl: string; certificateId: string; participantName: string }) => ({
        filename: `${cert.participantName.replace(/\s+/g, "-")}-${cert.certificateId}.svg`,
        content: cert.certificateUrl.split(",")[1],
      }),
    )

    // Create participant list for email body
    const participantList = certificates
      .map(
        (cert: { participantName: string; participantEmail: string }) =>
          `<li><strong>${cert.participantName}</strong> (${cert.participantEmail})</li>`,
      )
      .join("")

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [ownerEmail],
        subject: `All Certificates for ${eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Certificates for ${eventName}</h2>
            <p style="color: #666; line-height: 1.6;">
              All certificates for your event have been generated and are attached to this email.
            </p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Participants (${certificates.length})</h3>
              <ul style="color: #666; line-height: 1.8;">
                ${participantList}
              </ul>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Testing Mode:</strong> Since you haven't verified a domain with Resend, 
                all certificates are being sent to your email address. To send certificates directly 
                to participants, please verify a domain at 
                <a href="https://resend.com/domains" style="color: #0066cc;">resend.com/domains</a>.
              </p>
            </div>

            <p style="color: #666; line-height: 1.6;">
              You can forward these certificates to the respective participants, or verify your domain 
              to enable direct delivery.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">
              This is an automated email from EventEye certificate generation system.
            </p>
          </div>
        `,
        attachments,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Resend API error:", data.message)
      throw new Error(data.message || "Failed to send email")
    }

    console.log("[v0] Bulk email sent successfully:", data.id)

    return NextResponse.json({
      success: true,
      emailId: data.id,
    })
  } catch (error) {
    console.error("[v0] Error sending bulk email:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    )
  }
}
