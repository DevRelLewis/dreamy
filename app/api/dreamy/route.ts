import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const ASSISTANT_ID = 'asst_7Y5Exec5MCiqPUKWn12cqDA8';

export async function POST(req: NextRequest) {
  try {
    const { prompt, userId, sessionId } = await req.json();

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Prompt and userId are required' }, { status: 400 });
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
        return acc;
      }, '');

      let newSessionId = sessionId;

      // Save or update the dream session
      if (sessionId) {
        // Fetch the existing session
        const { data: existingSession, error: fetchError } = await supabase
          .from('dream_sessions')
          .select('dream_text, interpretation')
          .eq('id', sessionId)
          .single();

        if (fetchError) {
          console.error('Error fetching existing session:', fetchError);
          return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }

        // Update existing session
        const { error: updateError } = await supabase
          .from('dream_sessions')
          .update({
            dream_text: `${existingSession.dream_text}\n\n${prompt}`,
            interpretation: `${existingSession.interpretation}\n\n${responseContent}`
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error('Error updating dream session:', updateError);
          return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }
      } else {
        // Create new session
        const { data: insertedSession, error: insertError } = await supabase
          .from('dream_sessions')
          .insert({
            user_id: userId,
            dream_text: prompt,
            interpretation: responseContent
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving dream session:', insertError);
          return NextResponse.json({ error: 'Failed to create new session' }, { status: 500 });
        }

        newSessionId = insertedSession.id;
      }

      return NextResponse.json({ 
        reply: responseContent,
        sessionId: newSessionId
      });
    } else {
      throw new Error('No response from assistant');
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to get assistant response' }, { status: 500 });
  }
}