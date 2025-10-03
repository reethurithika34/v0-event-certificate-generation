"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface EventFormData {
  eventName: string
  eventDate: string
  organizerName: string
  organizerTitle: string
  organizerOrganization: string
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void
  isLoading?: boolean
}

export function EventForm({ onSubmit, isLoading }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    eventName: "",
    eventDate: "",
    organizerName: "",
    organizerTitle: "",
    organizerOrganization: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isValid = formData.eventName && formData.eventDate && formData.organizerName

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="eventName">Event Name *</Label>
          <Input
            id="eventName"
            value={formData.eventName}
            onChange={(e) => handleChange("eventName", e.target.value)}
            placeholder="e.g., Annual Tech Conference 2025"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventDate">Event Date *</Label>
          <Input
            id="eventDate"
            type="date"
            value={formData.eventDate}
            onChange={(e) => handleChange("eventDate", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizerName">Organizer Name *</Label>
          <Input
            id="organizerName"
            value={formData.organizerName}
            onChange={(e) => handleChange("organizerName", e.target.value)}
            placeholder="e.g., John Smith"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizerTitle">Organizer Title</Label>
          <Input
            id="organizerTitle"
            value={formData.organizerTitle}
            onChange={(e) => handleChange("organizerTitle", e.target.value)}
            placeholder="e.g., Event Director"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizerOrganization">Organization</Label>
          <Input
            id="organizerOrganization"
            value={formData.organizerOrganization}
            onChange={(e) => handleChange("organizerOrganization", e.target.value)}
            placeholder="e.g., Tech Events Inc."
          />
        </div>

        <Button type="submit" className="w-full" disabled={!isValid || isLoading}>
          {isLoading ? "Processing..." : "Continue to Preview"}
        </Button>
      </form>
    </Card>
  )
}
