"use server"

import { generateText } from "ai"

export async function formatParticipantName(name: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      prompt: `Format this person's name for a formal certificate. 
      
Rules:
- Capitalize first letter of each word
- Keep the original spelling exactly as provided
- Remove extra spaces
- Do not translate or change the name
- Return ONLY the formatted name, nothing else

Name: ${name}

Formatted name:`,
      maxOutputTokens: 100,
      temperature: 0.1,
    })

    return text.trim()
  } catch (error) {
    console.error("[v0] Error formatting name:", error)
    // Fallback: simple capitalization
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }
}

export async function formatParticipantNames(names: string[]): Promise<string[]> {
  try {
    const formattedNames = await Promise.all(names.map((name) => formatParticipantName(name)))
    return formattedNames
  } catch (error) {
    console.error("[v0] Error formatting names:", error)
    return names
  }
}
