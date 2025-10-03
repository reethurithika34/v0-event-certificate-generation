"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/file-upload"
import { EventForm } from "@/components/event-form"
import { ParticipantsTable } from "@/components/participants-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { UploadedData, Event, Participant } from "@/lib/types"
import { saveEvent } from "@/lib/storage"
import { formatParticipantNames } from "@/lib/name-formatter"
import {
  generateCertificateId,
  generateQRCodeData,
  generateCertificateSVG,
  svgToDataUrl,
} from "@/lib/certificate-generator"
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "details" | "preview">("upload")
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([])
  const [eventData, setEventData] = useState<Partial<Event> | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDataParsed = (data: UploadedData[]) => {
    setUploadedData(data)
    setStep("details")
  }

  const handleEventSubmit = async (formData: any) => {
    setIsProcessing(true)

    try {
      const names = uploadedData.map((d) => d.name)
      const formattedNames = formatParticipantNames(names)

      // Create participants
      const newParticipants: Participant[] = uploadedData.map((data, index) => ({
        id: `participant-${Date.now()}-${index}`,
        name: data.name,
        email: data.email,
        formattedName: formattedNames[index],
        status: "pending",
      }))

      setParticipants(newParticipants)
      setEventData({
        ...formData,
        participants: newParticipants,
        totalParticipants: newParticipants.length,
        deliveredCount: 0,
        bouncedCount: 0,
        pendingCount: newParticipants.length,
      })

      setStep("preview")
    } catch (error) {
      console.error("[v0] Error processing event:", error)
      alert("Failed to process event data. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateCertificates = async () => {
    if (!eventData) return

    setIsProcessing(true)

    try {
      const event: Event = {
        id: `event-${Date.now()}`,
        eventName: eventData.eventName!,
        eventDate: eventData.eventDate!,
        organizerName: eventData.organizerName!,
        organizerTitle: eventData.organizerTitle,
        organizerOrganization: eventData.organizerOrganization,
        participants: participants,
        createdAt: new Date().toISOString(),
        totalParticipants: participants.length,
        deliveredCount: 0,
        bouncedCount: 0,
        pendingCount: participants.length,
      }

      // Generate certificates for all participants
      const updatedParticipants = await Promise.all(
        participants.map(async (participant) => {
          const certificateId = generateCertificateId()
          const qrCodeData = generateQRCodeData(certificateId, participant.email)

          const updatedParticipant = {
            ...participant,
            certificateId,
            qrCodeData,
            status: "generating" as const,
          }

          const svg = await generateCertificateSVG(updatedParticipant, event)
          const certificateUrl = svgToDataUrl(svg)

          return {
            ...updatedParticipant,
            certificateUrl,
            status: "delivered" as const,
            deliveredAt: new Date().toISOString(),
          }
        }),
      )

      const finalEvent: Event = {
        ...event,
        participants: updatedParticipants,
        deliveredCount: updatedParticipants.length,
        pendingCount: 0,
      }

      saveEvent(finalEvent)
      router.push(`/dashboard/${finalEvent.id}`)
    } catch (error) {
      console.error("[v0] Error generating certificates:", error)
      alert("Failed to generate certificates. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {step === "upload" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to <span className="text-primary">EventEye</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered certificate generation and delivery platform for event organizers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 my-12">
              <Card className="p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold">AI-Powered Formatting</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically formats participant names correctly without altering original data
                </p>
              </Card>

              <Card className="p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold">Verified Certificates</h3>
                <p className="text-sm text-muted-foreground">
                  Each certificate includes a unique ID and AI-verifiable QR code
                </p>
              </Card>

              <Card className="p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold">Bulk Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and deliver certificates to all participants instantly
                </p>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Upload Participant Data</h2>
              <FileUpload onDataParsed={handleDataParsed} />
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-8">
            <div>
              <Button variant="ghost" onClick={() => setStep("upload")} className="mb-4">
                ← Back
              </Button>
              <h2 className="text-3xl font-bold">Event Details</h2>
              <p className="text-muted-foreground mt-2">Found {uploadedData.length} participants in your file</p>
            </div>

            <EventForm onSubmit={handleEventSubmit} isLoading={isProcessing} />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-8">
            <div>
              <Button variant="ghost" onClick={() => setStep("details")} className="mb-4">
                ← Back
              </Button>
              <h2 className="text-3xl font-bold">Preview & Generate</h2>
              <p className="text-muted-foreground mt-2">Review participant data before generating certificates</p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event Name</p>
                  <p className="font-semibold">{eventData?.eventName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event Date</p>
                  <p className="font-semibold">
                    {eventData?.eventDate && new Date(eventData.eventDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organizer</p>
                  <p className="font-semibold">{eventData?.organizerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="font-semibold">{participants.length}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Participants</h3>
              <ParticipantsTable participants={participants} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerateCertificates} disabled={isProcessing} size="lg">
                {isProcessing ? (
                  "Generating Certificates..."
                ) : (
                  <>
                    Generate & Deliver Certificates
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
