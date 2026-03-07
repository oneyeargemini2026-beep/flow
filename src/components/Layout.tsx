import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store';
import { ViewType } from '../types';
import { HexColorPicker } from 'react-colorful';

export const Sidebar = () => {
  const { currentView, setCurrentView, folders, setFolders, setIsFocusOpen, setIsAddTaskOpen, activeProject, setActiveProject, isSidebarOpen, setIsSidebarOpen, tasks, setTasks, moveProject, renameProject, tags, setTags, activeFolder, setActiveFolder } = useAppContext();
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggedProject, setDraggedProject] = useState<{ name: string, folderId: string } | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#7c6af7');
  
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#7c6af7');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);

  const [creatingProjectInFolder, setCreatingProjectInFolder] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null); // folderId or project-folderId-projName or tag-tagId

  const [colorPickerState, setColorPickerState] = useState<{
    isOpen: boolean;
    color: string;
    itemId?: string | null; // folderId or tagId
    itemType?: 'folder' | 'tag'; // 'folder' or 'tag'
    x: number;
    y: number;
  }>({ isOpen: false, color: '#ffffff', x: 0, y: 0 });

  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerState(prev => ({ ...prev, isOpen: false }));
      }
      // Also clear confirm delete state on outside click
      if (confirmDeleteId && !(e.target as Element).closest('.delete-btn')) {
        setConfirmDeleteId(null);
      }
    };
    if (colorPickerState.isOpen || confirmDeleteId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPickerState.isOpen, confirmDeleteId]);

  const handleColorChange = (newColor: string) => {
    setColorPickerState(prev => ({ ...prev, color: newColor }));
    if (colorPickerState.itemId) {
      if (colorPickerState.itemType === 'folder') {
        setFolders(prev => prev.map(f => f.id === colorPickerState.itemId ? { ...f, color: newColor } : f));
      } else if (colorPickerState.itemType === 'tag') {
        setTags(prev => prev.map(t => t.id === colorPickerState.itemId ? { ...t, color: newColor } : t));
      }
    } else {
      if (colorPickerState.itemType === 'folder') {
        setNewFolderColor(newColor);
      } else if (colorPickerState.itemType === 'tag') {
        setNewTagColor(newColor);
      }
    }
  };

  const openColorPicker = (e: React.MouseEvent, color: string, itemId: string | null = null, itemType: 'folder' | 'tag' = 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    let x = rect.left;
    let y = rect.bottom + 8;
    
    // Prevent going off-screen (approximate height of picker is 250px)
    if (y + 250 > window.innerHeight) {
      y = rect.top - 250 - 8;
    }

    setColorPickerState({
      isOpen: true,
      color,
      itemId,
      itemType,
      x,
      y
    });
  };

  const folderColors = ['#ff5c5c', '#ffbd5c', '#f0e65d', '#5cff8a', '#5cc2ff', '#7c6af7', '#b35cff', '#ff5cb3', '#8888a0', '#a3a3a3', '#ffffff'];

  const handleRenameFolder = (folderId: string) => {
    if (!editingFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: editingFolderName.trim() } : f));
    setEditingFolderId(null);
  };
  
  // Calculate Today's Progress
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayString();
  
  // Tasks completed today (regardless of due date)
  const completedTodayCount = tasks.filter(t => 
    t.completed && 
    !t.deleted && 
    t.completedDate && 
    t.completedDate.startsWith(todayStr)
  ).length;

  // Tasks due today or overdue (and not completed)
  const pendingTodayCount = tasks.filter(t => 
    !t.completed && 
    !t.deleted && 
    !t.isInbox && 
    t.dueDate && 
    t.dueDate <= todayStr
  ).length;

  const totalToday = completedTodayCount + pendingTodayCount;
  const isAllCompleted = totalToday > 0 && pendingTodayCount === 0;
  const progressPercentage = totalToday > 0 ? (completedTodayCount / totalToday) : 0;
  const circumference = 2 * Math.PI * 7; // r=7
  const strokeDashoffset = circumference * (1 - progressPercentage);

  const navItems: { id: ViewType; icon: string; label: string; badge?: number }[] = [
    { id: 'today', icon: '☀️', label: 'Today' },
    { id: 'upcoming', icon: '📅', label: 'Upcoming' },
    { id: 'inbox', icon: '📥', label: 'Inbox', badge: tasks.filter(t => t.isInbox && !t.deleted && !t.completed).length },
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'matrix', icon: '⊞', label: 'Matrix' },
    { id: 'calendar', icon: '◫', label: 'Calendar' },
    { id: 'history', icon: '📜', label: 'History' },
    { id: 'archive', icon: '🗄', label: 'Archive' },
    { id: 'tags', icon: '🏷️', label: 'Tags' },
    { id: 'trash', icon: '🗑️', label: 'Trash' },
  ];

  const handleNavClick = (id: ViewType) => {
    setCurrentView(id);
    setActiveProject(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const toggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f));
  };

  const handleFolderDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'folder');
    e.dataTransfer.setData('folder/id', id);
    setDraggedFolderId(id);

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-1000px';
    wrapper.style.left = '-1000px';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '9999';

    const clone = e.currentTarget.cloneNode(true) as HTMLElement;
    clone.classList.add('task-dragging-preview');
    clone.style.width = `${e.currentTarget.offsetWidth}px`;
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    wrapper.getBoundingClientRect();
    
    e.dataTransfer.setDragImage(wrapper, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    
    setTimeout(() => {
      document.body.removeChild(wrapper);
    }, 0);
  };

  const handleProjectDragStart = (e: React.DragEvent<HTMLDivElement>, projectName: string, folderId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'project');
    e.dataTransfer.setData('project/name', projectName);
    e.dataTransfer.setData('project/folderId', folderId);
    setDraggedProject({ name: projectName, folderId });
  };

  const handleProjectDragOver = (e: React.DragEvent<HTMLDivElement>, targetProjectName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedProject && draggedProject.name !== targetProjectName) {
      setDragOverProjectId(targetProjectName);
    }
  };

  const handleProjectDrop = (e: React.DragEvent<HTMLDivElement>, targetProjectName: string, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverProjectId(null);
    
    if (draggedProject) {
      const targetFolder = folders.find(f => f.id === targetFolderId);
      if (!targetFolder) return;
      
      const targetIndex = targetFolder.projects.indexOf(targetProjectName);
      moveProject(draggedProject.name, draggedProject.folderId, targetFolderId, targetIndex);
      setDraggedProject(null);
    }
  };

  const handleFolderDragEnd = () => {
    setDraggedFolderId(null);
    setDragOverFolderId(null);
    setDraggedProject(null);
    setDragOverProjectId(null);
  };

  const handleFolderDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Allow dropping projects into folders
    if (draggedProject && draggedProject.folderId !== id) {
      setDragOverFolderId(id);
      return;
    }

    if (draggedFolderId && draggedFolderId !== id) {
      setDragOverFolderId(id);
    }
  };

  const handleFolderDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const type = e.dataTransfer.getData('type');

    if (type === 'project') {
      const projectName = e.dataTransfer.getData('project/name');
      const fromFolderId = e.dataTransfer.getData('project/folderId');
      
      if (projectName && fromFolderId && fromFolderId !== targetId) {
        moveProject(projectName, fromFolderId, targetId);
      }
      return;
    }

    const draggedId = e.dataTransfer.getData('folder/id');
    
    if (draggedId && draggedId !== targetId) {
      setFolders(prev => {
        const draggedIndex = prev.findIndex(f => f.id === draggedId);
        const targetIndex = prev.findIndex(f => f.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        
        const newFolders = [...prev];
        const [draggedFolder] = newFolders.splice(draggedIndex, 1);
        newFolders.splice(targetIndex, 0, draggedFolder);
        return newFolders;
      });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      open: true,
      projects: []
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleCreateProject = (folderId: string) => {
    if (!newProjectName.trim()) return;
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return { ...f, projects: [...f.projects, newProjectName.trim()] };
      }
      return f;
    }));
    setNewProjectName('');
    setCreatingProjectInFolder(null);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const newTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newTagName.trim(),
      color: newTagColor
    };
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setIsCreatingTag(false);
  };

  const handleRenameTag = (tagId: string) => {
    if (!editingTagName.trim()) {
      setEditingTagId(null);
      return;
    }
    const oldTag = tags.find(t => t.id === tagId);
    if (!oldTag) return;
    
    const oldName = oldTag.name;
    const newName = editingTagName.trim();
    
    if (oldName === newName) {
      setEditingTagId(null);
      return;
    }

    setTags(prev => prev.map(t => t.id === tagId ? { ...t, name: newName } : t));
    
    // Update tasks with this tag
    setTasks(prev => prev.map(t => ({
      ...t,
      tags: t.tags.map(tag => tag === oldName ? newName : tag)
    })));
    
    setEditingTagId(null);
  };

  const handleDeleteTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    setTags(prev => prev.filter(t => t.id !== tagId));
    
    // Remove tag from tasks
    setTasks(prev => prev.map(t => ({
      ...t,
      tags: t.tags.filter(tagName => tagName !== tag.name)
    })));
    setConfirmDeleteId(null);
  };

  const handleTagDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'tag');
    e.dataTransfer.setData('tag/id', id);
    setDraggedTagId(id);

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-1000px';
    wrapper.style.left = '-1000px';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '9999';

    const clone = e.currentTarget.cloneNode(true) as HTMLElement;
    clone.classList.add('task-dragging-preview');
    clone.style.width = `${e.currentTarget.offsetWidth}px`;
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    wrapper.getBoundingClientRect();
    
    e.dataTransfer.setDragImage(wrapper, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    
    setTimeout(() => {
      document.body.removeChild(wrapper);
    }, 0);
  };

  const handleTagDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTagId && draggedTagId !== id) {
      setDragOverTagId(id);
    }
  };

  const handleTagDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    setDragOverTagId(null);
    const type = e.dataTransfer.getData('type');
    
    if (type === 'tag') {
      const draggedId = e.dataTransfer.getData('tag/id');
      if (draggedId && draggedId !== targetId) {
        setTags(prev => {
          const draggedIndex = prev.findIndex(t => t.id === draggedId);
          const targetIndex = prev.findIndex(t => t.id === targetId);
          
          if (draggedIndex === -1 || targetIndex === -1) return prev;
          
          const newTags = [...prev];
          const [draggedTag] = newTags.splice(draggedIndex, 1);
          newTags.splice(targetIndex, 0, draggedTag);
          return newTags;
        });
      }
    }
    setDraggedTagId(null);
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside className={`fixed md:relative z-50 top-0 left-0 h-screen bg-bg2 border-r border-border-subtle flex flex-col overflow-hidden shrink-0 no-scrollbar transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 w-60 min-w-[240px] md:shadow-none`}>
        <div className="p-5 pb-4 font-serif text-[22px] text-text-main border-b border-border-subtle flex items-center justify-between gap-2 shrink-0 h-14">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]"></div>
            <span>Flow</span>
          </div>
          <button 
            className="md:hidden p-1.5 -mr-1.5 text-text-muted hover:text-text-main rounded-md hover:bg-bg3 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
          <div className="p-3 pb-1 shrink-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint px-2 pb-2">Views</div>
            {navItems.map(item => (
              <div 
                key={item.id}
                className={`flex items-center gap-2.5 p-2 px-2.5 rounded-lg cursor-pointer text-[13.5px] transition-colors relative shrink-0 mb-0 ${currentView === item.id && !activeProject ? 'bg-accent/15 text-accent2' : 'text-text-muted hover:bg-bg3 hover:text-text-main'}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="w-4 text-center text-sm">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'today' ? (
                  <div className="ml-auto flex items-center justify-center w-5 h-5 relative">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="transform -rotate-90">
                      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" className="text-bg4" />
                      <circle 
                        cx="10" cy="10" r="7" 
                        fill="none" 
                        stroke={isAllCompleted ? "#22c55e" : "var(--color-accent)"} 
                        strokeWidth="2" 
                        strokeDasharray={`${2 * Math.PI * 7}`}
                        strokeDashoffset={`${strokeDashoffset}`}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <span className={`absolute text-[9px] font-mono ${isAllCompleted ? "text-green-500" : "text-text-faint"}`}>
                      {completedTodayCount}
                    </span>
                  </div>
                ) : item.badge ? (
                  <span className={`ml-auto font-mono text-[10px] px-1.5 py-[1px] rounded-full ${currentView === item.id && !activeProject ? 'bg-accent/25 text-accent2' : 'bg-bg4 text-text-faint'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="p-3 pb-1 mt-0 border-t-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint px-2 pb-2">Folders</div>
            {folders.filter(f => !f.deleted).map(folder => (
              <div 
                key={folder.id} 
                className={`flex flex-col items-stretch mb-0 transition-all ${draggedFolderId === folder.id ? 'opacity-30 border-dashed border-border-strong bg-transparent' : ''} ${dragOverFolderId === folder.id ? 'border-t-accent border-t-2 bg-bg3 rounded-lg' : ''} ${deletingFolderId === folder.id ? 'animate-disintegrate pointer-events-none' : ''}`}
                draggable
                onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                onDragEnd={handleFolderDragEnd}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
              >
                <div 
                  className={`flex items-center gap-2.5 p-2 px-2.5 rounded-lg cursor-pointer text-[13.5px] transition-colors group ${activeFolder === folder.name && currentView === 'folder' ? 'bg-accent/15 text-accent2' : 'text-text-muted hover:bg-bg3 hover:text-text-main'}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveFolder(folder.name);
                    setActiveProject(null);
                    setCurrentView('folder');
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                >
                  <div className="text-text-muted text-xs cursor-grab opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">⠿</div>
                  <button 
                    className="w-3 h-3 rounded-full shrink-0 relative overflow-hidden cursor-pointer ring-1 ring-offset-1 ring-offset-bg ring-text-main hover:ring-2 transition-all" 
                    title="Change color"
                    style={{ backgroundColor: folder.color }}
                    onClick={(e) => openColorPicker(e, folder.color, folder.id)}
                  />
                  {editingFolderId === folder.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingFolderName}
                      onChange={e => setEditingFolderName(e.target.value)}
                      onBlur={() => handleRenameFolder(folder.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                        if (e.key === 'Escape') setEditingFolderId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-text-main"
                    />
                  ) : (
                    <div 
                      className="flex-1 truncate"
                      style={{ color: folder.color }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingFolderId(folder.id);
                        setEditingFolderName(folder.name);
                      }}
                    >{folder.name}</div>
                  )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDeleteId === folder.id) {
                          setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, deleted: true } : f));
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(folder.id);
                        }
                      }}
                      className={`delete-btn p-1 rounded transition-colors opacity-100 shrink-0 ${confirmDeleteId === folder.id ? 'text-red-500 bg-red-500/10' : 'text-text-faint hover:text-red-500 hover:bg-red-500/10'}`}
                      title={confirmDeleteId === folder.id ? "Click again to confirm delete" : "Delete folder"}
                    >
                    {confirmDeleteId === folder.id ? (
                      <span className="text-[10px] font-bold px-1">CONFIRM</span>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    )}
                  </button>
                  <span 
                    className="text-[10px] text-text-faint cursor-pointer shrink-0 px-1 hover:text-text-main"
                    onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
                  >
                    {folder.open ? '▼' : '▶'}
                  </span>
                </div>
                {folder.open && (
                  <div className="flex pl-7 py-1 flex-col gap-0.5">
                    {folder.projects.map(proj => {
                        const pendingCount = tasks.filter(t => t.project === proj && !t.completed && !t.deleted).length;
                        const projDeleteId = `${folder.id}-${proj}`;
                        return (
                      <div 
                        key={proj}
                        draggable
                        onDragStart={(e) => handleProjectDragStart(e, proj, folder.id)}
                        onDragOver={(e) => handleProjectDragOver(e, proj)}
                        onDrop={(e) => handleProjectDrop(e, proj, folder.id)}
                        className={`flex items-center gap-2 p-1.5 px-2.5 rounded-md cursor-pointer text-[12.5px] transition-colors border-t-2 group/project ${dragOverProjectId === proj ? 'border-t-accent' : 'border-t-transparent'} ${activeProject === proj ? 'text-accent2' : 'text-text-faint hover:text-text-muted'}`}
                        onClick={() => { setActiveProject(proj); setCurrentView('project'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                      >
                        <span>◈ {proj}</span>
                        {pendingCount > 0 && (
                            <span className="ml-auto text-[10px] bg-bg4 text-text-faint px-1.5 rounded-full">{pendingCount}</span>
                        )}
                        <button
                            className={`delete-btn ml-auto p-0.5 rounded transition-colors ${confirmDeleteId === projDeleteId ? 'opacity-100 text-red-500 bg-red-500/10' : 'opacity-0 group-hover/project:opacity-100 text-text-faint hover:text-red-500 hover:bg-red-500/10'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirmDeleteId === projDeleteId) {
                                  setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, projects: f.projects.filter(p => p !== proj) } : f));
                                  // Also update tasks to remove project association
                                  setTasks(prev => prev.map(t => t.project === proj ? { ...t, project: undefined } : t));
                                  setConfirmDeleteId(null);
                                  if (activeProject === proj) setActiveProject(null);
                                } else {
                                  setConfirmDeleteId(projDeleteId);
                                }
                            }}
                            title={confirmDeleteId === projDeleteId ? "Click again to confirm delete" : "Delete project"}
                        >
                            {confirmDeleteId === projDeleteId ? (
                              <span className="text-[9px] font-bold px-1">CONFIRM</span>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            )}
                        </button>
                      </div>
                    )})}
                    {creatingProjectInFolder === folder.id ? (
                      <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-md bg-bg3">
                        <input 
                          autoFocus
                          type="text" 
                          value={newProjectName}
                          onChange={e => setNewProjectName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCreateProject(folder.id);
                            if (e.key === 'Escape') setCreatingProjectInFolder(null);
                          }}
                          placeholder="Project name..."
                          className="w-full bg-transparent border-none outline-none text-xs text-text-main placeholder:text-text-faint"
                        />
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-md cursor-pointer text-xs text-text-faint hover:text-text-muted hover:bg-bg3 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setCreatingProjectInFolder(folder.id); }}
                      >
                        <span>+</span> Add project
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isCreatingFolder ? (
              <div className="flex flex-col gap-2 p-2 px-2.5 mt-1 bg-bg3 rounded-lg border border-border-strong">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: newFolderColor }}></div>
                  <input 
                    autoFocus
                    type="text" 
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') setIsCreatingFolder(false);
                    }}
                    placeholder="Folder name..."
                    className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-text-main placeholder:text-text-faint"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {folderColors.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewFolderColor(c)}
                      className={`w-3 h-3 shrink-0 rounded-full ${newFolderColor === c ? 'ring-2 ring-offset-1 ring-offset-bg3 ring-text-main' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button 
                    className="flex items-center justify-center w-3 h-3 shrink-0 rounded-full cursor-pointer border border-border-strong hover:ring-2 hover:ring-offset-1 hover:ring-offset-bg3 hover:ring-text-main transition-all ml-0.5 text-text-muted hover:text-text-main" 
                    title="Custom color"
                    onClick={(e) => openColorPicker(e, newFolderColor, null)}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={() => setIsCreatingFolder(false)} className="text-[11px] text-text-faint hover:text-text-main">Cancel</button>
                  <button onClick={handleCreateFolder} className="text-[11px] text-accent2 hover:text-accent font-medium">Create</button>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 p-2 px-2.5 rounded-lg cursor-pointer text-[13px] text-text-faint hover:bg-bg3 hover:text-text-muted transition-colors mt-1"
                onClick={() => setIsCreatingFolder(true)}
              >
                <span className="text-base leading-none">+</span> New folder
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-3 border-t border-border-subtle">
          <div className="flex items-center gap-2.5 p-2 px-2.5 rounded-lg cursor-pointer text-[13.5px] text-text-muted hover:bg-bg3 hover:text-text-main transition-colors mb-0" onClick={() => { setIsFocusOpen(true); if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
            <span className="w-4 text-center text-sm">⏱</span>
            <span>Focus Mode</span>
          </div>
        </div>
      </aside>

      {/* Custom Color Picker Popover */}
      {colorPickerState.isOpen && (
        <div 
          ref={colorPickerRef}
          className="fixed z-[100] bg-bg border border-border-strong rounded-xl shadow-xl p-3 flex flex-col gap-3"
          style={{ 
            top: `${colorPickerState.y}px`, 
            left: `${colorPickerState.x}px`,
          }}
        >
          <HexColorPicker color={colorPickerState.color} onChange={handleColorChange} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-faint font-mono uppercase">Hex</span>
            <input 
              type="text" 
              value={colorPickerState.color} 
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 bg-bg3 border border-border-strong rounded-md px-2 py-1 text-xs text-text-main font-mono outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </>
  );
};

export const Topbar = () => {
  const { currentView, activeProject, setIsAddTaskOpen, setIsSidebarOpen, renameProject } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  const titles: Record<string, string> = {
    today: 'Today', inbox: 'Inbox', upcoming: 'Upcoming',
    dashboard: 'Dashboard', matrix: 'Eisenhower Matrix',
    calendar: 'Calendar', archive: 'Archive', trash: 'Trash'
  };

  const title = activeProject || titles[currentView] || currentView;

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const handleRename = () => {
    if (activeProject && editedTitle !== activeProject) {
      renameProject(activeProject, editedTitle);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 px-3.5 md:px-6 h-12 md:h-14 border-b border-border-subtle shrink-0">
      <button 
        className="md:hidden p-1.5 -ml-1.5 text-text-muted hover:text-text-main rounded-md hover:bg-bg3 transition-colors"
        onClick={() => setIsSidebarOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div>
        {activeProject && isEditing ? (
          <input 
            type="text" 
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditedTitle(title);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="font-serif text-base md:text-[20px] font-normal bg-transparent border-none outline-none text-text-main"
          />
        ) : (
          <div 
            className={`font-serif text-base md:text-[20px] font-normal ${activeProject ? 'cursor-pointer hover:underline decoration-dotted underline-offset-4' : ''}`}
            onClick={() => {
              if (activeProject) {
                setIsEditing(true);
                setEditedTitle(activeProject);
              }
            }}
          >
            {title}
          </div>
        )}
      </div>
      <div className="flex-1"></div>
      {(currentView === 'today' || currentView === 'upcoming') && !activeProject && (
        <div className="hidden md:flex gap-1">
          <div className="px-3 py-1.5 rounded-md cursor-pointer text-xs font-mono transition-colors bg-bg3 text-text-main">List</div>
        </div>
      )}
      <button 
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none"
        onClick={() => setIsAddTaskOpen(true)}
      >
        + Task
      </button>
    </div>
  );
};
