import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255).trim(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
