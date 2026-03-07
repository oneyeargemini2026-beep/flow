import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Folder, Archive, ViewType, MatrixConfig } from './types';

const initialFolders: Folder[] = [
  { id: 'f1', name: 'Work', color: '#7c6af7', open: true, projects: ['Q2 Launch', 'Hiring'] },
  { id: 'f2', name: 'Personal', color: '#3ecf8e', open: false, projects: ['Side Project'] }
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

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      activeProject, setActiveProject,
      tasks, setTasks,
      folders, setFolders,
      archives, setArchives,
      matrixConfig, setMatrixConfig,
      isFocusOpen, setIsFocusOpen,
      isAddTaskOpen, setIsAddTaskOpen,
      isProcessInboxOpen, setIsProcessInboxOpen,
      isSidebarOpen, setIsSidebarOpen,
      moveProject, renameProject
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
