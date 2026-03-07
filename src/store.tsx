import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Folder, Archive, ViewType, MatrixConfig, Tag } from './types';
import { getLocalDateString } from './utils';

const initialFolders: Folder[] = [
  { id: 'f1', name: 'Work', color: '#7c6af7', open: true, projects: ['Q2 Launch', 'Hiring'] },
  { id: 'f2', name: 'Personal', color: '#3ecf8e', open: false, projects: ['Side Project'] }
];

const initialTags: Tag[] = [
  { id: 't1', name: 'Urgent', color: '#ff5c5c' },
  { id: 't2', name: 'Home', color: '#3ecf8e' }
];

const initialTasks: Task[] = [];

const initialArchives: Archive[] = [];

const initialMatrixConfig: MatrixConfig = {
  q1: { title: 'Do First', subtitle: 'URGENT · IMPORTANT', color: '#ff5c5c' },
  q2: { title: 'Schedule', subtitle: 'NOT URGENT · IMPORTANT', color: '#3ecf8e' },
  q3: { title: 'Delegate', subtitle: 'URGENT · NOT IMPORTANT', color: '#ffbd5c' },
  q4: { title: 'Eliminate', subtitle: 'NOT URGENT · NOT IMPORTANT', color: '#8888a0' }
};

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (v: ViewType) => void;
  activeProject: string | null;
  setActiveProject: (p: string | null) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  archives: Archive[];
  setArchives: React.Dispatch<React.SetStateAction<Archive[]>>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  matrixConfig: MatrixConfig;
  setMatrixConfig: React.Dispatch<React.SetStateAction<MatrixConfig>>;
  isFocusOpen: boolean;
  setIsFocusOpen: (v: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (v: boolean) => void;
  isProcessInboxOpen: boolean;
  setIsProcessInboxOpen: (v: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  moveProject: (projectName: string, fromFolderId: string, toFolderId: string, targetIndex?: number) => void;
  renameProject: (oldName: string, newName: string) => void;
  duplicateTask: (taskId: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tasks');
      return saved ? JSON.parse(saved) : initialTasks;
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
      return initialTasks;
    }
  });
  
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('folders');
      return saved ? JSON.parse(saved) : initialFolders;
    } catch (e) {
      console.error('Failed to load folders from localStorage', e);
      return initialFolders;
    }
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem('tags');
      return saved ? JSON.parse(saved) : initialTags;
    } catch (e) {
      console.error('Failed to load tags from localStorage', e);
      return initialTags;
    }
  });
  
  const [archives, setArchives] = useState<Archive[]>(() => {
    try {
      const saved = localStorage.getItem('archives');
      return saved ? JSON.parse(saved) : initialArchives;
    } catch (e) {
      console.error('Failed to load archives from localStorage', e);
      return initialArchives;
    }
  });

  const [matrixConfig, setMatrixConfig] = useState<MatrixConfig>(() => {
    try {
      const saved = localStorage.getItem('matrixConfig');
      return saved ? JSON.parse(saved) : initialMatrixConfig;
    } catch (e) {
      console.error('Failed to load matrixConfig from localStorage', e);
      return initialMatrixConfig;
    }
  });

  // Auto-archive logic
  useEffect(() => {
    const today = getLocalDateString();
    const tasksToArchive = tasks.filter(t => {
      if (!t.completed || !t.completedDate) return false;
      // Compare only the date part (YYYY-MM-DD)
      const taskDate = t.completedDate.split('T')[0];
      return taskDate < today; // Archive if completed BEFORE today
    });

    if (tasksToArchive.length > 0) {
      setArchives(prevArchives => {
        const newArchives = [...prevArchives];
        
        tasksToArchive.forEach(task => {
          const date = new Date(task.completedDate!);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          const archiveName = monthYear;
          
          let archive = newArchives.find(a => a.name === archiveName);
          
          if (!archive) {
            const month = date.getMonth() + 1;
            let quarter: 'q1' | 'q2' | 'q3' | 'q4' = 'q1';
            if (month > 3) quarter = 'q2';
            if (month > 6) quarter = 'q3';
            if (month > 9) quarter = 'q4';

            archive = {
              id: `arch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: archiveName,
              color: '#8888a0',
              start: task.completedDate!,
              end: task.completedDate!,
              tasks: 0,
              completed: 0,
              tags: [],
              quarter: quarter,
              items: []
            };
            newArchives.push(archive);
          }
          
          if (!archive.items) archive.items = [];
          // Check if task is already in archive to prevent duplicates (though filter should handle this)
          if (!archive.items.find(t => t.id === task.id)) {
             archive.items.push(task);
             archive.tasks++;
             archive.completed++;
             
             if (task.completedDate! < archive.start) archive.start = task.completedDate!;
             if (task.completedDate! > archive.end) archive.end = task.completedDate!;
          }
        });
        
        return newArchives;
      });

      setTasks(prevTasks => prevTasks.filter(t => !tasksToArchive.find(a => a.id === t.id)));
    }
  }, [tasks]); // Only depend on tasks to avoid circular dependency with archives

  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('folders', JSON.stringify(folders));
    } catch (e) {
      console.error('Failed to save folders to localStorage', e);
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem('tags', JSON.stringify(tags));
    } catch (e) {
      console.error('Failed to save tags to localStorage', e);
    }
  }, [tags]);

  useEffect(() => {
    try {
      localStorage.setItem('archives', JSON.stringify(archives));
    } catch (e) {
      console.error('Failed to save archives to localStorage', e);
    }
  }, [archives]);

  useEffect(() => {
    try {
      localStorage.setItem('matrixConfig', JSON.stringify(matrixConfig));
    } catch (e) {
      console.error('Failed to save matrixConfig to localStorage', e);
    }
  }, [matrixConfig]);

  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isProcessInboxOpen, setIsProcessInboxOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const moveProject = (projectName: string, fromFolderId: string, toFolderId: string, targetIndex?: number) => {
    setFolders(prev => {
      // Deep copy to avoid mutation issues
      const newFolders = JSON.parse(JSON.stringify(prev));
      
      const fromFolder = newFolders.find((f: Folder) => f.id === fromFolderId);
      const toFolder = newFolders.find((f: Folder) => f.id === toFolderId);
      
      if (!fromFolder || !toFolder) return prev;

      // Remove from source
      const projectIndex = fromFolder.projects.indexOf(projectName);
      if (projectIndex === -1) return prev;
      
      fromFolder.projects.splice(projectIndex, 1);
      
      // Add to destination
      if (targetIndex !== undefined && targetIndex !== null) {
        toFolder.projects.splice(targetIndex, 0, projectName);
      } else {
        toFolder.projects.push(projectName);
      }
      
      return newFolders;
    });
  };

  const renameProject = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    
    // Update folders
    setFolders(prev => prev.map(f => ({
      ...f,
      projects: f.projects.map(p => p === oldName ? newName : p)
    })));

    // Update tasks
    setTasks(prev => prev.map(t => t.project === oldName ? { ...t, project: newName } : t));

    if (activeProject === oldName) {
      setActiveProject(newName);
    }
  };

  const duplicateTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${task.title} (Copy)`,
      completed: false,
      completedDate: undefined,
      // Keep other properties like priority, tags, project, etc.
    };

    setTasks(prev => {
      const index = prev.findIndex(t => t.id === taskId);
      if (index === -1) return [...prev, newTask];
      const newTasks = [...prev];
      newTasks.splice(index + 1, 0, newTask);
      return newTasks;
    });
  };

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      activeProject, setActiveProject,
      tasks, setTasks,
      folders, setFolders,
      archives, setArchives,
      tags, setTags,
      matrixConfig, setMatrixConfig,
      isFocusOpen, setIsFocusOpen,
      isAddTaskOpen, setIsAddTaskOpen,
      isProcessInboxOpen, setIsProcessInboxOpen,
      isSidebarOpen, setIsSidebarOpen,
      moveProject, renameProject,
      duplicateTask
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('Missing AppContext');
  return ctx;
};
