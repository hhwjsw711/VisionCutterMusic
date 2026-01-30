'use client';

import { fal } from '@fal-ai/client';

export function initFalClient(apiKey: string) {
  fal.config({
    credentials: apiKey,
  });
}

export interface T2IResult {
  imageUrl: string;
}

export interface I2VResult {
  videoUrl: string;
}

export async function generateImage(
  prompt: string,
  aspectRatio: '16:9' | '1:1' | '9:16' = '16:9',
  onProgress?: (progress: number) => void
): Promise<T2IResult> {
  console.log('[FAL] Generating image with aspect ratio:', aspectRatio);

  const result = await fal.subscribe('xai/grok-imagine', {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS' && onProgress) {
        onProgress(50);
      }
    },
  });

  console.log('[FAL] Image result:', JSON.stringify(result.data, null, 2));

  const data = result.data as { images?: { url: string }[] };
  if (!data.images || data.images.length === 0) {
    console.error('[FAL] No images in response:', result.data);
    throw new Error('No image generated');
  }

  const imageUrl = data.images[0].url;
  console.log('[FAL] Generated image URL:', imageUrl);

  return {
    imageUrl,
  };
}

export async function generateVideo(
  imageUrl: string,
  prompt: string = 'subtle camera movement, slow zoom, cinematic motion',
  onProgress?: (progress: number) => void
): Promise<I2VResult> {
  const result = await fal.subscribe('xai/grok-imagine-video/image-to-video', {
    input: {
      image_url: imageUrl,
      prompt: prompt, // Required: describes the motion
      duration: 1, // Generate 1 second video (1-15 seconds allowed)
      resolution: '720p',
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS' && onProgress) {
        onProgress(50);
      }
    },
  });

  const data = result.data as { video?: { url: string } };
  if (!data.video || !data.video.url) {
    throw new Error('No video generated');
  }

  return {
    videoUrl: data.video.url,
  };
}
