import { Router, Request, Response } from 'express';
import { Track } from '../models/index.js';

export const catalogRouter = Router();

let cachedFiltersResponse: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60_000; // Cache for 60 seconds

// GET /api/catalog/filters - dynamic filter choices based on approved tracks
catalogRouter.get('/filters', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedFiltersResponse && now - lastCacheTime < CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.json(cachedFiltersResponse);
    }

    const approvedTracks = await Track.find({
      status: 'approved',
      sourceType: { $ne: 'synthetic_demo' },
      tags: { $ne: 'demo' },
    }).select('languages categories era genres difficulty');

    const languagesSet = new Set<string>();
    const categoriesSet = new Set<string>();
    const erasSet = new Set<string>();
    const genresSet = new Set<string>();
    let minDifficulty = 1;
    let maxDifficulty = 5;

    for (const track of approvedTracks) {
      track.languages?.forEach((l) => languagesSet.add(l));
      track.categories?.forEach((c) => categoriesSet.add(c));
      if (track.era) erasSet.add(track.era);
      track.genres?.forEach((g) => genresSet.add(g));
    }

    cachedFiltersResponse = {
      languages: Array.from(languagesSet).sort(),
      categories: Array.from(categoriesSet).sort(),
      eras: Array.from(erasSet).sort(),
      genres: Array.from(genresSet).sort(),
      difficultyRange: { min: minDifficulty, max: maxDifficulty },
      totalApprovedTracks: approvedTracks.length,
      trackSummaries: approvedTracks.map((t) => ({
        id: t._id,
        languages: t.languages || [],
        categories: t.categories || [],
        era: t.era || '',
        genres: t.genres || [],
        difficulty: t.difficulty || 2,
      })),
    };
    lastCacheTime = now;

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(cachedFiltersResponse);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch catalog filters' } });
  }
});
