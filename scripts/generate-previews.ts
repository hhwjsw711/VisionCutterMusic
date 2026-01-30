/**
 * Generate style preview images using FAL.ai grok-imagine
 *
 * Usage:
 *   FAL_KEY=your_api_key npx tsx scripts/generate-previews.ts
 */

import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  console.error('Error: FAL_KEY environment variable is required');
  console.log('Usage: FAL_KEY=your_api_key npx tsx scripts/generate-previews.ts');
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const styles = [
  {
    id: 'retro-halftone',
    prompt: 'Abstract music visualization with sound waves and geometric shapes, retro halftone print style, vintage newspaper aesthetic, risograph texture, limited color palette of red orange and teal, Ben-Day dots, pop art influenced, grainy texture, high contrast',
  },
  {
    id: 'cyberpunk-neon',
    prompt: 'Abstract music visualization with sound waves and digital elements, cyberpunk style, neon lights glowing magenta and cyan, dark atmosphere, futuristic city skyline, reflective surfaces, blade runner aesthetic',
  },
  {
    id: 'synthwave-sunset',
    prompt: 'Abstract music visualization with sound waves over grid landscape, synthwave aesthetic, 80s retro style, neon grid, gradient sunset sky in pink purple and orange, VHS scan lines, chrome elements, outrun style',
  },
  {
    id: 'anime-cel',
    prompt: 'Abstract music visualization with dynamic sound waves, anime style, cel-shaded, bold black outlines, vibrant saturated colors red blue and yellow, speed lines, dramatic lighting, studio quality animation',
  },
  {
    id: 'watercolor-dream',
    prompt: 'Abstract music visualization with flowing sound waves, watercolor painting style, soft flowing edges, pastel color palette in soft teal pink and cream, paper texture visible, dreamy atmosphere, impressionistic',
  },
  {
    id: 'glitch-vaporwave',
    prompt: 'Abstract music visualization with sound waves and digital artifacts, vaporwave aesthetic, glitch art, RGB color split, corrupted pixels, pink cyan and green neon colors, retro computer graphics',
  },
  {
    id: 'film-noir',
    prompt: 'Abstract music visualization with sound waves, film noir style, high contrast black and white, dramatic shadows, venetian blind lighting, 1940s detective aesthetic, cigarette smoke, moody atmosphere',
  },
  {
    id: 'cosmic-nebula',
    prompt: 'Abstract music visualization with sound waves in cosmic nebula, deep space, swirling galaxies, millions of stars, cosmic dust clouds, purple and blue nebula, astronomical photography, infinite universe',
  },
  {
    id: 'pixel-art',
    prompt: 'Abstract music visualization with sound waves, pixel art style, 16-bit video game graphics, chunky pixels, limited color palette, retro gaming aesthetic, dithering effect, nostalgic 90s games',
  },
  {
    id: 'art-deco',
    prompt: 'Abstract music visualization with sound waves, art deco style, 1920s glamour, geometric patterns, metallic gold accents, gatsby era, ornate decorations, black and gold, sunburst motifs',
  },
  {
    id: 'ukiyo-e',
    prompt: 'Abstract music visualization with sound waves, ukiyo-e style, traditional Japanese woodblock print, Hokusai great wave influence, flat colors, bold outlines, Edo period art aesthetic',
  },
  {
    id: 'neon-tokyo',
    prompt: 'Abstract music visualization with sound waves, neon Tokyo night style, Japanese city nightlife, kanji neon signs, rainy streets, reflections on wet pavement, urban Japan aesthetic',
  },
  {
    id: 'psychedelic',
    prompt: 'Abstract music visualization with sound waves, psychedelic 60s style, trippy swirls, rainbow colors, optical illusions, lava lamp aesthetic, kaleidoscope effect, groovy vibrations',
  },
  {
    id: 'comic-book',
    prompt: 'Abstract music visualization with sound waves, comic book style, bold outlines, Ben-Day dots, action words, primary colors, halftone printing, dynamic composition',
  },
  {
    id: 'low-poly',
    prompt: 'Abstract music visualization with sound waves, low poly 3D style, geometric faceted surfaces, gradient shading, crystal forms, triangular mesh, modern digital art, soft lighting',
  },
  {
    id: 'grunge-90s',
    prompt: 'Abstract music visualization with sound waves, grunge 90s style, dirty textures, scratches and noise, torn paper collage, distressed typography, xerox aesthetics, punk zine style',
  },
  {
    id: 'vapor-gradient',
    prompt: 'Abstract music visualization with sound waves, vapor gradient style, smooth gradient mesh, soft color transitions, chrome 3D elements, y2k aesthetic, aurora colors, holographic sheen',
  },
];

const outputDir = path.join(__dirname, '../public/previews');

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generatePreview(style: typeof styles[0]) {
  console.log(`Generating preview for: ${style.id}...`);

  try {
    const result = await fal.subscribe('xai/grok-imagine', {
      input: { prompt: style.prompt },
    });

    const data = result.data as { images?: { url: string }[] };

    if (data.images && data.images.length > 0) {
      const imageUrl = data.images[0].url;
      const filepath = path.join(outputDir, `${style.id}.jpg`);

      await downloadImage(imageUrl, filepath);
      console.log(`  ✓ Saved: ${filepath}`);
    } else {
      console.log(`  ✗ No image returned for ${style.id}`);
    }
  } catch (error) {
    console.error(`  ✗ Error generating ${style.id}:`, error);
  }
}

async function main() {
  console.log('Generating style preview images...\n');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate previews sequentially to avoid rate limits
  for (const style of styles) {
    await generatePreview(style);
  }

  console.log('\nDone!');
}

main();
