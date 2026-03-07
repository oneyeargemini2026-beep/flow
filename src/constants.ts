import { Folder, Task, Archive, MatrixConfig } from './types';

export const initialFolders: Folder[] = [
  { id: 'f1', name: 'Work', color: '#7c6af7', open: true, projects: ['Q2 Launch', 'Hiring'] },
  { id: 'f2', name: 'Personal', color: '#3ecf8e', open: false, projects: ['Side Project'] }
];

export const initialTasks: Task[] = [];

export const initialArchives: Archive[] = [];

export const initialMatrixConfig: MatrixConfig = {
  q1: { title: 'Do First', subtitle: 'URGENT · IMPORTANT', color: '#ff5c5c' },
  q2: { title: 'Schedule', subtitle: 'NOT URGENT · IMPORTANT', color: '#3ecf8e' },
  q3: { title: 'Delegate', subtitle: 'URGENT · NOT IMPORTANT', color: '#ffbd5c' },
  q4: { title: 'Eliminate', subtitle: 'NOT URGENT · NOT IMPORTANT', color: '#8888a0' }
};
