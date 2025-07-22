import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are Ditto, an AI assistant for a productivity hub. You help users manage projects, analyze documentation, and provide insights about their work. 

You have access to information about:
- PayNow project: A payment platform with 23/31 tasks completed, currently on track
- CRM Dashboard: Customer management UI with 12/28 tasks completed, currently at risk
- Recent activities, meeting notes, and project documentation
- Integration with JIRA, Confluence, and Fireflies

Be helpful, concise, and focus on productivity insights. When asked about specific projects or metrics, provide relevant details based on the dashboard context.`,
    messages,
  })

  return result.toDataStreamResponse()
}
