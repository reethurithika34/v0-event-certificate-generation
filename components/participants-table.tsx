"use client"

import type { Participant } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, Loader2, Mail } from "lucide-react"

interface ParticipantsTableProps {
  participants: Participant[]
}

export function ParticipantsTable({ participants }: ParticipantsTableProps) {
  const getStatusIcon = (status: Participant["status"]) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "bounced":
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "generating":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: Participant["status"]) => {
    const variants: Record<Participant["status"], "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      generating: "secondary",
      delivered: "default",
      bounced: "destructive",
      failed: "destructive",
    }

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Certificate ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {participants.map((participant) => (
              <tr key={participant.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{participant.formattedName || participant.name}</div>
                    {participant.formattedName && participant.formattedName !== participant.name && (
                      <div className="text-xs text-muted-foreground">Original: {participant.name}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{participant.email}</span>
                    {participant.emailSentAt && (
                      <Mail
                        className="w-3 h-3 text-green-600"
                        title={`Sent at ${new Date(participant.emailSentAt).toLocaleString()}`}
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-xs">{participant.certificateId || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(participant.status)}
                    {getStatusBadge(participant.status)}
                  </div>
                  {participant.error && (
                    <div className="text-xs text-red-600 mt-1" title={participant.error}>
                      {participant.error.substring(0, 50)}...
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
