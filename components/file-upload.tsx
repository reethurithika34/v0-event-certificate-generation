"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { parseFile } from "@/lib/file-parser"
import type { UploadedData } from "@/lib/types"

interface FileUploadProps {
  onDataParsed: (data: UploadedData[]) => void
}

export function FileUpload({ onDataParsed }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      await processFile(droppedFile)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      await processFile(selectedFile)
    }
  }

  const processFile = async (selectedFile: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      const data = await parseFile(selectedFile)

      if (data.length === 0) {
        throw new Error("No valid data found in file")
      }

      setFile(selectedFile)
      onDataParsed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file")
      setFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
  }

  return (
    <Card className="p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="sr-only"
          disabled={isProcessing}
        />

        {!file ? (
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center gap-4 p-12 cursor-pointer">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>

            <div className="text-center">
              <p className="text-lg font-medium">
                {isProcessing ? "Processing file..." : "Drop your file here or click to browse"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
              <p className="mt-2 text-xs text-muted-foreground">File must contain "name" and "email" columns</p>
            </div>

            <Button type="button" disabled={isProcessing}>
              Select File
            </Button>
          </label>
        ) : (
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded bg-primary/10">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={clearFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    </Card>
  )
}
