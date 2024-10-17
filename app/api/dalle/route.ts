import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Prompt and userId are required' }, { status: 400 });
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

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Generate a unique filename
    const filename = `dream_image_${Date.now()}.png`;
    const filePath = `${userId}/${filename}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('dream-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png'
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('dream-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ imageUrl: publicUrlData.publicUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate and save image' }, { status: 500 });
  }
}