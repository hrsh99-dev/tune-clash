import { z } from 'zod';

export const RoomSettingsSchema = z.object({
  languages: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  eras: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  difficultyMode: z.union([z.number().min(1).max(5), z.literal('all')]).default('all'),
  roundCount: z.number().int().min(1).max(20).default(5),
  chaosMode: z.boolean().default(false),
  clipSeconds: z.number().int().min(6).max(10).default(8),
});

export const CreateRoomSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, 'Nickname must be at least 2 characters')
    .max(20, 'Nickname cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_\-\s\u0900-\u097F]+$/, 'Nickname contains invalid characters'),
  settings: RoomSettingsSchema.partial().optional(),
});

export const JoinRoomSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, 'Nickname must be at least 2 characters')
    .max(20, 'Nickname cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_\-\s\u0900-\u097F]+$/, 'Nickname contains invalid characters'),
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, 'Room code must be exactly 6 characters')
    .regex(/^[A-Z0-9]{6}$/, 'Room code must consist of uppercase alphanumeric characters'),
  reconnectToken: z.string().optional(),
});

export const SubmitAnswerSchema = z.object({
  requestId: z.string().min(1).max(64),
  answer: z
    .string()
    .trim()
    .min(1, 'Answer cannot be empty')
    .max(120, 'Answer is too long (maximum 120 characters)'),
});

export const TrackAdminCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  artists: z.array(z.string().trim().min(1)).min(1, 'At least one artist is required'),
  acceptedAnswers: z.array(z.string().trim().min(1)).default([]),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  categories: z.array(z.string()).min(1, 'At least one category is required'),
  genres: z.array(z.string()).default([]),
  releaseYear: z.number().int().min(1900).max(2100).optional(),
  era: z.string().min(1).default('2020s'),
  difficulty: z.number().int().min(1).max(5).default(2),
  tags: z.array(z.string()).default([]),
  clipStartMs: z.number().int().min(0).default(0),
  clipEndMs: z.number().int().min(6000).max(10000).default(8000),
  sourceType: z.enum(['synthetic_demo', 'direct_upload', 'licensed_provider']).default('direct_upload'),
  // Rights / License fields required before approval
  rights: z.object({
    rightsHolderOrSubmitter: z.string().trim().min(1, 'Rights holder / submitter is required'),
    licenseType: z.string().trim().min(1, 'License type is required'),
    allowedUses: z.array(z.string()).min(1, 'Allowed uses are required'),
    territories: z.array(z.string()).default(['worldwide']),
    commercialUseAllowed: z.boolean().default(false),
    modificationAllowed: z.boolean().default(false),
    attributionRequired: z.boolean().default(false),
    attributionText: z.string().optional(),
    evidenceReference: z.string().trim().min(1, 'Evidence reference / documentation note is required'),
    notes: z.string().optional(),
  }),
});

export const TrackAdminUpdateSchema = TrackAdminCreateSchema.partial();
