export interface Participant {
  id: string
  name: string
  email: string
  formattedName?: string
  status: "pending" | "generating" | "delivered" | "bounced" | "failed"
  certificateUrl?: string
  certificateId?: string
  qrCodeData?: string
  deliveredAt?: string
  error?: string
  emailId?: string
  emailSentAt?: string
}

export interface Event {
  id: string
  eventName: string
  eventDate: string
  organizerName: string
  organizerTitle?: string
  organizerOrganization?: string
  participants: Participant[]
  createdAt: string
  totalParticipants: number
  deliveredCount: number
  bouncedCount: number
  pendingCount: number
}

export interface UploadedData {
  name: string
  email: string
  [key: string]: string
}
