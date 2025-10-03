import type { UploadedData } from "./types"

export async function parseCSV(file: File): Promise<UploadedData[]> {
  const text = await file.text()
  const lines = text.split("\n").filter((line) => line.trim())

  if (lines.length < 2) {
    throw new Error("CSV file must contain headers and at least one data row")
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const nameIndex = headers.findIndex((h) => h.includes("name"))
  const emailIndex = headers.findIndex((h) => h.includes("email") || h.includes("mail"))

  if (nameIndex === -1 || emailIndex === -1) {
    throw new Error('CSV must contain "name" and "email" columns')
  }

  const data: UploadedData[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    if (values.length >= 2 && values[nameIndex] && values[emailIndex]) {
      data.push({
        name: values[nameIndex],
        email: values[emailIndex],
      })
    }
  }

  return data
}

export async function parseExcel(file: File): Promise<UploadedData[]> {
  // For Excel files, we'll use a simple approach
  // In production, you'd use a library like xlsx
  throw new Error("Excel parsing requires the xlsx library. Please use CSV format or convert your Excel file to CSV.")
}

export async function parseFile(file: File): Promise<UploadedData[]> {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "csv") {
    return parseCSV(file)
  } else if (extension === "xlsx" || extension === "xls") {
    return parseExcel(file)
  } else {
    throw new Error("Unsupported file format. Please upload a CSV or Excel file.")
  }
}
