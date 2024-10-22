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

    // Verify user exists before proceeding
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Assistant response timeout');
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastAssistantMessage = messages.data
      .filter(message => message.role === 'assistant')
      .pop();

    if (!lastAssistantMessage) {
      throw new Error('No response from assistant');
    }

    const responseContent = lastAssistantMessage.content.reduce((acc, content) => {
      if (content.type === 'text') {
        return acc + content.text.value;
      }
      return acc;
    }, '');

    let newSessionId = sessionId;

    if (sessionId) {
      const { data: existingSession, error: fetchError } = await supabase
        .from('dream_sessions')
        .select('dream_text, interpretation')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing session:', fetchError);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }

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
      const { data: insertedSession, error: insertError } = await supabase
        .from('dream_sessions')
        .insert({
          user_id: userId,
          dream_text: prompt,
          interpretation: responseContent,
          messages: [] // Initialize empty messages array
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
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get assistant response'
    }, { status: 500 });
  }
}