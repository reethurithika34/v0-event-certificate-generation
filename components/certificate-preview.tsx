"use client"

import type { Participant, Event } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CertificatePreviewProps {
  participant: Participant
  event: Event
}

export function CertificatePreview({ participant, event }: CertificatePreviewProps) {
  const handleDownload = () => {
    if (!participant.certificateUrl) return

    const link = document.createElement("a")
    link.href = participant.certificateUrl
    link.download = `certificate-${participant.certificateId}.svg`
    link.click()
  }

  if (!participant.certificateUrl) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Certificate not yet generated</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Certificate Preview</h3>
          <Button onClick={handleDownload} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <img
            src={participant.certificateUrl || "/placeholder.svg"}
            alt={`Certificate for ${participant.formattedName || participant.name}`}
            className="w-full h-auto"
          />
        </div>
      </div>
    </Card>
  )
}
