export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Assignee {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: Assignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  completedAt?: string;
}

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue' | 'completedAt'>;

export interface TaskActivity {
  id: string;
  message: string;
  taskTitle: string;
  actor: Assignee;
  occurredAt: string;
  kind: 'created' | 'updated' | 'completed' | 'deleted';
}

export const TEAM_MEMBERS: Assignee[] = [
  { id: 'u1', name: 'Olivia Rhye', email: 'olivia@acme.com', initials: 'OR' },
  { id: 'u2', name: 'Phoenix Baker', email: 'phoenix@acme.com', initials: 'PB' },
  { id: 'u3', name: 'Lana Steiner', email: 'lana@acme.com', initials: 'LS' },
  { id: 'u4', name: 'Demi Wilkinson', email: 'demi@acme.com', initials: 'DW' },
  { id: 'u5', name: 'Candice Wu', email: 'candice@acme.com', initials: 'CW' },
];

export const CURRENT_USER = TEAM_MEMBERS[0];
