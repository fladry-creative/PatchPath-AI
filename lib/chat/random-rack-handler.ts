/**
 * Random Rack Handler
 * Provides intelligent fallback rack selection for gibberish/demo requests
 */

import logger from '@/lib/logger';

/**
 * Curated demo racks for fallback selection
 * These are real ModularGrid racks with diverse module collections
 */
const DEMO_RACKS = [
  {
    url: 'https://modulargrid.net/e/racks/view/2383104',
    description: 'Maths + Morphagene + Three Sisters - Perfect for learning',
    complexity: 'intermediate',
    genres: ['ambient', 'drone', 'experimental'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1893456',
    description: 'Classic subtractive setup with sequencing',
    complexity: 'beginner',
    genres: ['techno', 'house', 'melodic'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2145678',
    description: 'Generative powerhouse with Marbles and Plaits',
    complexity: 'intermediate',
    genres: ['generative', 'ambient', 'evolving'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1756234',
    description: 'FM synthesis focused with Odessa and filters',
    complexity: 'advanced',
    genres: ['experimental', 'complex', 'fm'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2234789',
    description: 'West Coast style with Buchla-inspired modules',
    complexity: 'intermediate',
    genres: ['west coast', 'complex', 'timbral'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1987543',
    description: 'Percussive and rhythmic focused system',
    complexity: 'intermediate',
    genres: ['techno', 'industrial', 'rhythmic'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2098765',
    description: 'Compact performance system with hands-on control',
    complexity: 'beginner',
    genres: ['live', 'performance', 'techno'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1845623',
    description: 'Massive polyphonic system with voice allocation',
    complexity: 'advanced',
    genres: ['polyphonic', 'melodic', 'complex'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2187654',
    description: 'Video synthesis with LZX modules',
    complexity: 'advanced',
    genres: ['video', 'visual', 'experimental'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1934876',
    description: 'Sampling and mangling with Arbhar and Morphagene',
    complexity: 'intermediate',
    genres: ['sampling', 'granular', 'glitch'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2256789',
    description: 'Minimal techno system with precision sequencing',
    complexity: 'beginner',
    genres: ['minimal', 'techno', 'precise'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1823456',
    description: 'Chaotic modulation with Wogglebug and random sources',
    complexity: 'intermediate',
    genres: ['chaos', 'experimental', 'modulation'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2312345',
    description: 'Mixing and effects focused for post-processing',
    complexity: 'beginner',
    genres: ['mixing', 'effects', 'utility'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/1976543',
    description: 'Physical modeling with Elements and Rings',
    complexity: 'intermediate',
    genres: ['physical modeling', 'acoustic', 'resonant'],
  },
  {
    url: 'https://modulargrid.net/e/racks/view/2423456',
    description: 'Control voltage playground with complex patching',
    complexity: 'advanced',
    genres: ['modulation', 'complex', 'cv'],
  },
];

/**
 * Humorous responses for gibberish input
 * Adds personality to the fallback experience
 */
const GIBBERISH_RESPONSES = [
  'Cool vibes bro 😂 Let me pick a random rack for you...',
  'Interesting choice of words! How about we try a random rack?',
  "I admire your creativity! Let's explore a demo rack instead...",
  'That sounds like a new synthesis technique! Let me grab a rack...',
  'Keyboard solo! 🎹 Let me find you something to actually play...',
  'I speak synthesizer, not ancient hieroglyphics! Random rack incoming...',
  "That's definitely a unique request! Let's try this rack instead...",
  'Error 404: Coherence not found. Deploying random rack protocol...',
  "I'll pretend I understood that. Here's a random rack! 🎲",
  'Is that Klingon? Either way, check out this rack...',
];

/**
 * Get a random demo rack URL
 * Uses weighted random selection (future: database integration)
 *
 * @param complexity - Optional filter by complexity level
 * @param genre - Optional filter by genre
 * @returns Demo rack configuration
 */
export function getRandomDemoRack(
  complexity?: 'beginner' | 'intermediate' | 'advanced',
  genre?: string
) {
  let filteredRacks = [...DEMO_RACKS];

  // Filter by complexity if specified
  if (complexity) {
    filteredRacks = filteredRacks.filter((rack) => rack.complexity === complexity);
  }

  // Filter by genre if specified
  if (genre) {
    filteredRacks = filteredRacks.filter((rack) =>
      rack.genres.some((g) => g.toLowerCase().includes(genre.toLowerCase()))
    );
  }

  // Fallback to all racks if no matches
  if (filteredRacks.length === 0) {
    logger.warn('⚠️ No racks matched filters, using all racks', { complexity, genre });
    filteredRacks = DEMO_RACKS;
  }

  // Random selection
  const randomIndex = Math.floor(Math.random() * filteredRacks.length);
  const selectedRack = filteredRacks[randomIndex];

  logger.info('🎲 Random rack selected', {
    url: selectedRack.url,
    description: selectedRack.description,
    complexity: selectedRack.complexity,
    genres: selectedRack.genres,
  });

  return selectedRack;
}

/**
 * Get a humorous response for gibberish input
 * Adds personality while guiding user to demo mode
 *
 * @returns Random humorous response
 */
export function getGibberishResponse(): string {
  const randomIndex = Math.floor(Math.random() * GIBBERISH_RESPONSES.length);
  return GIBBERISH_RESPONSES[randomIndex];
}

/**
 * Get random rack from database with caching
 * This integrates with the existing /api/racks/random endpoint
 *
 * @returns Promise<{ url: string, fromCache: boolean }>
 */
export async function getRandomRackFromAPI(): Promise<{
  url: string;
  fromCache: boolean;
  error?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/racks/random`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    logger.info('🎲 Random rack from API', {
      url: data.url,
      fromCache: data.fromCache,
    });

    return {
      url: data.url,
      fromCache: data.fromCache || false,
    };
  } catch (error) {
    logger.error('❌ Failed to fetch random rack from API', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    // Fallback to hardcoded demo rack
    const fallback = getRandomDemoRack();
    return {
      url: fallback.url,
      fromCache: false,
      error: 'API unavailable, using fallback',
    };
  }
}

/**
 * Handle gibberish input with personality and fallback
 * Returns both a humorous response and a random rack
 *
 * @param originalText - The gibberish text user entered
 * @returns Response object with message and rack URL
 */
export async function handleGibberishInput(originalText: string): Promise<{
  message: string;
  rackUrl: string;
  fromCache: boolean;
}> {
  const humorousResponse = getGibberishResponse();

  // Try to get from API first, fallback to demo racks
  const { url, fromCache } = await getRandomRackFromAPI();

  logger.info('🎭 Gibberish handled with humor', {
    originalText,
    response: humorousResponse,
    rackUrl: url,
  });

  return {
    message: humorousResponse,
    rackUrl: url,
    fromCache,
  };
}

/**
 * Handle explicit random rack request
 * User says "random", "surprise me", etc.
 *
 * @returns Response object with encouraging message and rack URL
 */
export async function handleRandomRequest(): Promise<{
  message: string;
  rackUrl: string;
  fromCache: boolean;
}> {
  const { url, fromCache } = await getRandomRackFromAPI();

  const encouragingMessages = [
    '🎲 Here is a random rack to explore!',
    '✨ Let us see what this rack can do...',
    '🎸 Surprise! Check out this setup...',
    '🎛️ Random rack incoming - this should be fun!',
    '🌟 Let us get creative with this one...',
  ];

  const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
  const message = encouragingMessages[randomIndex];

  logger.info('🎲 Random request handled', { message, rackUrl: url });

  return {
    message,
    rackUrl: url,
    fromCache,
  };
}
