/**
 * Format participant names for certificates without AI
 * Properly capitalizes names while preserving original data
 */
export function formatParticipantName(name: string): string {
  if (!name || typeof name !== "string") {
    return name
  }

  // Trim extra spaces
  const trimmed = name.trim()

  // Split by spaces and capitalize each word
  const words = trimmed.split(/\s+/)

  const formatted = words.map((word) => {
    if (word.length === 0) return word

    // Handle special cases like "McDonald", "O'Brien", "van der", etc.
    if (word.includes("'")) {
      return word
        .split("'")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("'")
    }

    if (word.includes("-")) {
      return word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("-")
    }

    // Standard capitalization
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })

  return formatted.join(" ")
}

export function formatParticipantNames(names: string[]): string[] {
  return names.map((name) => formatParticipantName(name))
}
