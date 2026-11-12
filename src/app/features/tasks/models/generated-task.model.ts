import type { Assignee } from '../../../shared/models/task.model';

/** Raw task record shape loaded from the generated task seed data. */
export interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
  assignee: Omit<Assignee, 'initials'>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
