"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Event } from "@/lib/types"
import { loadEvents, saveEvent } from "@/lib/storage"
import { ParticipantsTable } from "@/components/participants-table"
import { CertificatePreview } from "@/components/certificate-preview"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Download, Mail, CheckCircle2, XCircle, Clock, Send, Loader2 } from "lucide-react"
import { sendBulkCertificates, sendAllCertificatesToOwner } from "@/lib/email-service"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedParticipant, setSelectedParticipant] = useState<number>(0)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [emailProgress, setEmailProgress] = useState({ completed: 0, total: 0 })
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [ownerEmail, setOwnerEmail] = useState("rithikakotra2007@gmail.com")
  const [emailMode, setEmailMode] = useState<"individual" | "bulk">("bulk")

  useEffect(() => {
    setIsLoading(true)
    const events = loadEvents()
    const foundEvent = events.find((e) => e.id === params.eventId)

    if (foundEvent) {
      setEvent(foundEvent)
    } else {
      router.push("/")
    }
    setIsLoading(false)
  }, [params.eventId, router])

  const handleSendEmails = async () => {
    if (!event) return

    const participantsToEmail = event.participants.filter(
      (p) => p.certificateUrl && p.certificateId && (!p.emailSentAt || p.status === "failed"),
    )

    if (participantsToEmail.length === 0) {
      toast({
        title: "No emails to send",
        description: "All participants have already received their certificates.",
      })
      return
    }

    setShowEmailDialog(true)
  }

  const handleConfirmSendEmails = async () => {
    if (!event) return
    setShowEmailDialog(false)

    const participantsToEmail = event.participants.filter(
      (p) => p.certificateUrl && p.certificateId && (!p.emailSentAt || p.status === "failed"),
    )

    setIsSendingEmails(true)
    setEmailProgress({ completed: 0, total: participantsToEmail.length })

    console.log("[v0] Starting email send in", emailMode, "mode")

    try {
      if (emailMode === "bulk") {
        const result = await sendAllCertificatesToOwner(ownerEmail, participantsToEmail, {
          eventName: event.eventName,
        })

        if (result.success) {
          const updatedParticipants = event.participants.map((participant) => {
            const wasInList = participantsToEmail.find((p) => p.id === participant.id)
            if (wasInList) {
              return {
                ...participant,
                status: "delivered" as const,
                emailId: result.emailId,
                emailSentAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
              }
            }
            return participant
          })

          const updatedEvent: Event = {
            ...event,
            participants: updatedParticipants,
            deliveredCount: updatedParticipants.filter((p) => p.status === "delivered").length,
            bouncedCount: updatedParticipants.filter((p) => p.status === "bounced").length,
            pendingCount: updatedParticipants.filter((p) => p.status === "pending").length,
          }

          saveEvent(updatedEvent)
          setEvent(updatedEvent)

          toast({
            title: "Certificates sent!",
            description: `All ${participantsToEmail.length} certificates have been sent to ${ownerEmail}. You can forward them to participants.`,
          })
        } else {
          throw new Error(result.error || "Failed to send email")
        }
      } else {
        const results = await sendBulkCertificates(
          participantsToEmail.map((p) => ({
            id: p.id,
            email: p.email,
            name: p.name,
            formattedName: p.formattedName,
            certificateUrl: p.certificateUrl!,
            certificateId: p.certificateId!,
          })),
          { eventName: event.eventName },
          (completed, total) => {
            setEmailProgress({ completed, total })
          },
        )

        const updatedParticipants = event.participants.map((participant) => {
          const result = results.find((r) => r.participantId === participant.id)
          if (result) {
            return {
              ...participant,
              status: result.success ? ("delivered" as const) : ("failed" as const),
              emailId: result.emailId,
              emailSentAt: result.success ? new Date().toISOString() : undefined,
              error: result.error,
              deliveredAt: result.success ? new Date().toISOString() : participant.deliveredAt,
            }
          }
          return participant
        })

        const successCount = results.filter((r) => r.success).length
        const failedCount = results.filter((r) => !r.success).length

        const updatedEvent: Event = {
          ...event,
          participants: updatedParticipants,
          deliveredCount: updatedParticipants.filter((p) => p.status === "delivered").length,
          bouncedCount: updatedParticipants.filter((p) => p.status === "bounced").length,
          pendingCount: updatedParticipants.filter((p) => p.status === "pending").length,
        }

        saveEvent(updatedEvent)
        setEvent(updatedEvent)

        toast({
          title: failedCount > 0 ? "Some emails failed" : "Emails sent!",
          description:
            failedCount > 0
              ? `${successCount} sent successfully. ${failedCount} failed. Try "Send to My Email" instead.`
              : `Successfully sent ${successCount} certificate(s).`,
          variant: failedCount > 0 ? "destructive" : "default",
        })
      }
    } catch (error) {
      console.error("[v0] Error sending emails:", error)
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmails(false)
      setEmailProgress({ completed: 0, total: 0 })
    }
  }

  const handleDownloadAll = () => {
    if (!event) return
    event.participants.forEach((participant) => {
      if (participant.certificateUrl) {
        const link = document.createElement("a")
        link.href = participant.certificateUrl
        link.download = `certificate-${participant.certificateId}.svg`
        link.click()
      }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const pendingEmailsCount = event.participants.filter(
    (p) => p.certificateUrl && p.certificateId && (!p.emailSentAt || p.status === "failed"),
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-3xl font-bold">{event.eventName}</h1>
              <p className="text-muted-foreground mt-1">
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSendEmails} disabled={isSendingEmails || pendingEmailsCount === 0} size="lg">
                {isSendingEmails ? (
                  <>
                    <Mail className="w-4 h-4 mr-2 animate-pulse" />
                    Sending {emailProgress.completed}/{emailProgress.total}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Emails ({pendingEmailsCount})
                  </>
                )}
              </Button>
              <Button onClick={handleDownloadAll} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{event.totalParticipants}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{event.deliveredCount}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{event.bouncedCount}</p>
                  <p className="text-sm text-muted-foreground">Bounced</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{event.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Participants</h2>
              <ParticipantsTable participants={event.participants} />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Certificate Preview</h2>
              {event.participants[selectedParticipant] && (
                <CertificatePreview participant={event.participants[selectedParticipant]} event={event} />
              )}

              <div className="flex gap-2 flex-wrap">
                {event.participants.map((participant, index) => (
                  <Button
                    key={participant.id}
                    variant={selectedParticipant === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedParticipant(index)}
                  >
                    {participant.formattedName || participant.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Card className="p-6 bg-amber-50 border-amber-200">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">Testing Mode Active</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Resend is in testing mode and can only send emails to <strong>{ownerEmail}</strong>. All certificates
                  will be sent to your email address as attachments.
                </p>
                <p className="text-sm text-amber-800">
                  To send certificates directly to participants, verify a domain at{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    resend.com/domains
                  </a>
                  .
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-2">Email Delivery Setup</h3>
            <p className="text-sm text-muted-foreground mb-3">
              To enable email delivery, add the following environment variables to your project:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <code className="bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> - Your Resend API key (get one at{" "}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  resend.com
                </a>
                )
              </li>
              <li>
                <code className="bg-muted px-1 py-0.5 rounded">EMAIL_FROM</code> - Sender email address (e.g.,
                certificates@yourdomain.com)
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Without these variables, the system will simulate email sending for testing purposes.
            </p>
          </Card>
        </div>
      </div>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Certificates</DialogTitle>
            <DialogDescription>Choose how you want to send the certificates.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Delivery Mode</Label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input
                    type="radio"
                    name="emailMode"
                    value="bulk"
                    checked={emailMode === "bulk"}
                    onChange={(e) => setEmailMode(e.target.value as "bulk")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Send to My Email (Recommended)</div>
                    <div className="text-sm text-muted-foreground">
                      All certificates will be sent to your email as attachments. You can then forward them to
                      participants.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 opacity-60">
                  <input
                    type="radio"
                    name="emailMode"
                    value="individual"
                    checked={emailMode === "individual"}
                    onChange={(e) => setEmailMode(e.target.value as "individual")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Send to Each Participant</div>
                    <div className="text-sm text-muted-foreground">
                      Requires domain verification. Will fail in testing mode.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {emailMode === "bulk" && (
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Your Email Address</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground">All certificates will be sent to this email address.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSendEmails} disabled={!ownerEmail && emailMode === "bulk"}>
              <Send className="w-4 h-4 mr-2" />
              Send Certificates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
