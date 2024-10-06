import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge'; // Use Edge Runtime

const openai = new OpenAI({
  apiKey: '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',
});

const ASSISTANT_ID = 'asst_7Y5Exec5MCiqPUKWn12cqDA8';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the user's prompt to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Retrieve the messages
    const messages = await openai.beta.threads.messages.list(thread.id);

    // Get the last assistant message
    const lastAssistantMessage = messages.data
      .filter(message => message.role === 'assistant')
      .pop();

    if (lastAssistantMessage) {
      const responseContent = lastAssistantMessage.content.reduce((acc, content) => {
        if (content.type === 'text') {
          return acc + content.text.value;
        }
        // Handle other content types (e.g., images) if needed
        return acc;
      }, '');

      return NextResponse.json({ reply: responseContent });
    } else {
      throw new Error('No response from assistant');
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to get assistant response' }, { status: 500 });
  }
}