export type ViewType = 'today' | 'upcoming' | 'inbox' | 'dashboard' | 'matrix' | 'calendar' | 'archive' | 'trash' | 'history';
export type Priority = 'p1' | 'p2' | 'p3' | 'p4';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  dueTime?: string;
  tags: string[];
  completed: boolean;
  completedDate?: string;
  project?: string;
  section?: string;
  subtasks?: Subtask[];
  isInbox?: boolean;
  deleted?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  open: boolean;
  projects: string[];
  deleted?: boolean;
}

export interface Archive {
  id: string;
  name: string;
  color: string;
  start: string;
  end: string;
  tasks: number;
  completed: number;
  tags: string[];
  quarter?: 'q1' | 'q2' | 'q3' | 'q4';
  items?: Task[];
}

export interface MatrixQuadrant {
  title: string;
  subtitle: string;
  color: string;
}

export interface MatrixConfig {
  q1: MatrixQuadrant;
  q2: MatrixQuadrant;
  q3: MatrixQuadrant;
  q4: MatrixQuadrant;
}
