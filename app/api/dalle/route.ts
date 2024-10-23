// dalle.ts
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

export const config = {
  maxDuration: 300 // Set maximum duration to 5 minutes
};

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const { prompt, userId } = await req.json();

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

    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const base64Image = image.data[0].b64_json;

    if (!base64Image) {
      throw new Error('Failed to generate image: No base64 data received');
    }

    const imageBuffer = Buffer.from(base64Image, 'base64');
    const filename = `dream_image_${Date.now()}.png`;
    const filePath = `${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('dream-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('dream-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ imageUrl: publicUrlData.publicUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate and save image',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}