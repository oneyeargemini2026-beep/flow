export type ViewType = 'today' | 'upcoming' | 'inbox' | 'dashboard' | 'matrix' | 'calendar' | 'notes' | 'archive' | 'trash' | 'history' | 'tags' | 'folder' | 'project' | 'goals';
export type Priority = 'p1' | 'p2' | 'p3' | 'p4';

export interface Goal {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
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
  goalId?: string;
  repeat?: 'daily' | 'weekly' | 'monthly';
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  open: boolean;
  projects: string[];
  deleted?: boolean;
}

export type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';

export interface Archive {
  id: string;
  name: string;
  color: string;
  start: string;
  end: string;
  tasks: number;
  completed: number;
  tags: string[];
  month?: Month;
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

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  deleted?: boolean;
}

export interface UserActivity {
  activeDates: string[];
}
