import { z } from 'zod';

export const APIResponseValidator = z.object({
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    metadata: z.object({
      prerequisites: z.array(z.string()),
      learningGoals: z.array(z.string()),
      estimatedTime: z.string()
    }).optional(),
    dialogue: z.array(z.object({
      speaker: z.string(),
      text: z.string(),
      purpose: z.string()
    })).optional()
  }))
});

export type APIResponse = z.infer<typeof APIResponseValidator>; 