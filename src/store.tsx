import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Task, Folder, Archive, ViewType, MatrixConfig, Tag, Goal } from './types';
import { getLocalDateString } from './utils';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, writeBatch, doc, setDoc, updateDoc } from 'firebase/firestore';

const initialFolders: Folder[] = [
  { id: 'f1', name: 'Work', color: '#7c6af7', open: true, projects: ['Q2 Launch', 'Hiring'] },
  { id: 'f2', name: 'Personal', color: '#3ecf8e', open: false, projects: ['Side Project'] }
];

const initialTags: Tag[] = [
  { id: 't1', name: 'Urgent', color: '#ff5c5c' },
  { id: 't2', name: 'Home', color: '#3ecf8e' }
];

const initialGoals: Goal[] = [];
const initialTasks: Task[] = [];
const initialArchives: Archive[] = [];

const initialMatrixConfig: MatrixConfig = {
  q1: { title: 'Do First', subtitle: 'URGENT · IMPORTANT', color: '#ff5c5c' },
  q2: { title: 'Schedule', subtitle: 'NOT URGENT · IMPORTANT', color: '#3ecf8e' },
  q3: { title: 'Delegate', subtitle: 'URGENT · NOT IMPORTANT', color: '#ffbd5c' },
  q4: { title: 'Eliminate', subtitle: 'NOT URGENT · NOT IMPORTANT', color: '#8888a0' }
};

function useSyncedCollection<T extends { id: string }>(
  collectionName: string,
  userId: string | undefined,
  initialData: T[] = []
): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [items, setItems] = useState<T[]>(initialData);
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (!userId) {
      setItems(initialData);
      initializedRef.current = false;
      return;
    }
    const q = query(collection(db, collectionName), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && !initializedRef.current && initialData.length > 0) {
        // Initialize default data for new users
        const batch = writeBatch(db);
        initialData.forEach(item => {
          const docRef = doc(db, collectionName, item.id);
          batch.set(docRef, { ...item, userId });
        });
        batch.commit().catch(console.error);
        setItems(initialData);
      } else {
        const newItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
        setItems(newItems);
      }
      initializedRef.current = true;
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
    });
    return unsub;
  }, [userId, collectionName]);

  const setSyncedItems: React.Dispatch<React.SetStateAction<T[]>> = (action) => {
    setItems(prev => {
      const newItems = typeof action === 'function' ? (action as any)(prev) : action;
      
      if (!userId) return newItems;

      const added = newItems.filter(n => !prev.find(p => p.id === n.id));
      const removed = prev.filter(p => !newItems.find(n => n.id === p.id));
      const modified = newItems.filter(n => {
        const p = prev.find(p => p.id === n.id);
        return p && JSON.stringify(p) !== JSON.stringify(n);
      });

      if (added.length === 0 && removed.length === 0 && modified.length === 0) {
        return newItems;
      }

      const batch = writeBatch(db);
      added.forEach(item => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, { ...item, userId });
      });
      modified.forEach(item => {
        const docRef = doc(db, collectionName, item.id);
        batch.update(docRef, { ...item, userId });
      });
      removed.forEach(item => {
        const docRef = doc(db, collectionName, item.id);
        batch.delete(docRef);
      });
      batch.commit().catch(console.error);

      return newItems;
    });
  };

  return [items, setSyncedItems];
}

function useSyncedDocument<T>(
  collectionName: string,
  docId: string,
  userId: string | undefined,
  initialData: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [item, setItem] = useState<T>(initialData);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setItem(initialData);
      initializedRef.current = false;
      return;
    }
    const docRef = doc(db, collectionName, docId);
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setItem(snapshot.data() as T);
      } else if (!initializedRef.current) {
        setDoc(docRef, { ...initialData, userId }).catch(console.error);
        setItem(initialData);
      }
      initializedRef.current = true;
    }, (error) => {
      console.error(`Error fetching ${collectionName}/${docId}:`, error);
    });
    return unsub;
  }, [userId, collectionName, docId]);

  const setSyncedItem: React.Dispatch<React.SetStateAction<T>> = (action) => {
    setItem(prev => {
      const newItem = typeof action === 'function' ? (action as any)(prev) : action;
      if (!userId) return newItem;
      
      if (JSON.stringify(prev) !== JSON.stringify(newItem)) {
        const docRef = doc(db, collectionName, docId);
        updateDoc(docRef, { ...newItem, userId }).catch(console.error);
      }
      return newItem;
    });
  };

  return [item, setSyncedItem];
}

interface AppContextType {
  user: User | null;
  signIn: () => void;
  signOutUser: () => void;
  currentView: ViewType;
  setCurrentView: (v: ViewType) => void;
  activeProject: string | null;
  setActiveProject: (p: string | null) => void;
  activeFolder: string | null;
  setActiveFolder: (f: string | null) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  archives: Archive[];
  setArchives: React.Dispatch<React.SetStateAction<Archive[]>>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
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
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  const [tasks, setTasks] = useSyncedCollection<Task>('tasks', user?.uid, initialTasks);
  const [folders, setFolders] = useSyncedCollection<Folder>('folders', user?.uid, initialFolders);
  const [tags, setTags] = useSyncedCollection<Tag>('tags', user?.uid, initialTags);
  const [goals, setGoals] = useSyncedCollection<Goal>('goals', user?.uid, initialGoals);
  const [archives, setArchives] = useSyncedCollection<Archive>('archives', user?.uid, initialArchives);
  const [matrixConfig, setMatrixConfig] = useSyncedDocument<MatrixConfig>('matrixConfigs', user?.uid || 'default', user?.uid, initialMatrixConfig);

  // Auto-archive logic
  useEffect(() => {
    if (!user) return;
    
    const today = getLocalDateString();
    const tasksToArchive = tasks.filter(t => {
      if (!t.completed || !t.completedDate) return false;
      const taskDate = t.completedDate.split('T')[0];
      return taskDate < today;
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
  }, [tasks, user]);

  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isProcessInboxOpen, setIsProcessInboxOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const moveProject = (projectName: string, fromFolderId: string, toFolderId: string, targetIndex?: number) => {
    setFolders(prev => {
      const newFolders = JSON.parse(JSON.stringify(prev));
      const fromFolder = newFolders.find((f: Folder) => f.id === fromFolderId);
      const toFolder = newFolders.find((f: Folder) => f.id === toFolderId);
      
      if (!fromFolder || !toFolder) return prev;

      const projectIndex = fromFolder.projects.indexOf(projectName);
      if (projectIndex === -1) return prev;
      
      fromFolder.projects.splice(projectIndex, 1);
      
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
    
    let renamed = false;
    setFolders(prev => prev.map(f => {
      if (!renamed && f.projects.includes(oldName)) {
        renamed = true;
        const newProjects = [...f.projects];
        const index = newProjects.indexOf(oldName);
        if (index !== -1) {
          newProjects[index] = newName;
        }
        return {
          ...f,
          projects: newProjects
        };
      }
      return f;
    }));

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
    };

    setTasks(prev => {
      const index = prev.findIndex(t => t.id === taskId);
      if (index === -1) return [...prev, newTask];
      const newTasks = [...prev];
      newTasks.splice(index + 1, 0, newTask);
      return newTasks;
    });
  };

  if (!authReady) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-text-main">Loading...</div>;
  }

  return (
    <AppContext.Provider value={{
      user, signIn, signOutUser,
      currentView, setCurrentView,
      activeProject, setActiveProject,
      activeFolder, setActiveFolder,
      tasks, setTasks,
      folders, setFolders,
      archives, setArchives,
      tags, setTags,
      goals, setGoals,
      matrixConfig, setMatrixConfig,
      isFocusOpen, setIsFocusOpen,
      isAddTaskOpen, setIsAddTaskOpen,
      isProcessInboxOpen, setIsProcessInboxOpen,
      isSidebarOpen, setIsSidebarOpen,
      moveProject, renameProject,
      duplicateTask,
      editingTaskId, setEditingTaskId
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
