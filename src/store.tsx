import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Task, Folder, Archive, ViewType, MatrixConfig, Tag, Goal } from './types';
import { getLocalDateString, sanitizeData } from './utils';
import { auth, db } from '@/src/lib/firebase';
import { signInWithGoogle } from '@/src/lib/auth';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, writeBatch, doc, setDoc, updateDoc, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  const errorMsg = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorMsg);
  
  // Only throw if it's a permission error to be caught by ErrorBoundary
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    throw new Error(errorMsg);
  }
}

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
        // Initialize default data for new users with UNIQUE IDs to avoid conflicts
        const batch = writeBatch(db);
        initialData.forEach(item => {
          const uniqueId = `${item.id}-${userId}`;
          const docRef = doc(db, collectionName, uniqueId);
          batch.set(docRef, sanitizeData({ ...item, id: uniqueId, userId }));
        });
        batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, collectionName));
        setItems(initialData.map(item => ({ ...item, id: `${item.id}-${userId}` })));
      } else {
        const newItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
        setItems(newItems);
      }
      initializedRef.current = true;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
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
        batch.set(docRef, sanitizeData({ ...item, userId }));
      });
      modified.forEach(item => {
        const docRef = doc(db, collectionName, item.id);
        batch.update(docRef, sanitizeData({ ...item, userId }));
      });
      removed.forEach(item => {
        const docRef = doc(db, collectionName, item.id);
        batch.delete(docRef);
      });
      batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, collectionName));

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
        setDoc(docRef, sanitizeData({ ...initialData, userId })).catch(err => handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`));
        setItem(initialData);
      }
      initializedRef.current = true;
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    });
    return unsub;
  }, [userId, collectionName, docId]);

  const setSyncedItem: React.Dispatch<React.SetStateAction<T>> = (action) => {
    setItem(prev => {
      const newItem = typeof action === 'function' ? (action as any)(prev) : action;
      if (!userId) return newItem;
      
      if (JSON.stringify(prev) !== JSON.stringify(newItem)) {
        const docRef = doc(db, collectionName, docId);
        updateDoc(docRef, sanitizeData({ ...newItem, userId })).catch(err => handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${docId}`));
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
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
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
