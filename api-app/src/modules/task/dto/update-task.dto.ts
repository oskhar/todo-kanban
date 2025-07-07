import { z } from 'zod';
import { TaskStatus } from '../enums/task-status.enum';

export const UpdateTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
