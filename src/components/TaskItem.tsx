import React, { useState } from 'react';
import { Calendar, MoreVertical, Copy, Trash2, CheckCircle2, Circle, Clock, Tag, Target, ChevronRight, ChevronDown, Edit2, GripVertical } from 'lucide-react';
import { Task, Priority } from '../types';
import { useAppContext } from '../store';
import { getLocalISOString, getLocalDateString } from '../utils';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

const priorityColors: Record<Priority, string> = {
  p1: 'text-p1 bg-p1/10',
  p2: 'text-p2 bg-p2/10',
  p3: 'text-p3 bg-p3/10',
  p4: 'text-p4 bg-p4/10',
};

export const TaskItem: React.FC<{ task: Task; disableDrag?: boolean }> = ({ task, disableDrag = false }) => {
  const { tasks, setTasks, folders, duplicateTask, tags, setTags, goals, editingTaskId, setEditingTaskId } = useAppContext();
  const expanded = editingTaskId === task.id;
  
  const [localTask, setLocalTask] = useState<Task>(task);
  const prevExpandedRef = React.useRef(expanded);
  const isDeletingRef = React.useRef(false);

  // Sync local task when task changes and not expanded
  React.useEffect(() => {
    if (!expanded) {
      setLocalTask(task);
    }
  }, [task, expanded]);

  React.useEffect(() => {
    if (prevExpandedRef.current && !expanded && !isDeletingRef.current) {
      // Save changes to global state when exiting edit mode
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          const isInbox = !(localTask.project || localTask.dueDate);
          return { ...localTask, isInbox };
        }
        return t;
      }));
    }
    prevExpandedRef.current = expanded;
  }, [expanded, localTask, task.id, setTasks]);

  const setExpanded = (isExpanded: boolean) => {
    if (isExpanded) {
      setEditingTaskId(task.id);
    } else {
      setEditingTaskId(null);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddTag = (tagName: string) => {
    if (!tagName) return;
    
    // Check if tag exists in global tags
    const existingTag = tags.find(t => t.name === tagName);
    if (!existingTag) {
      // Create new tag in global state
      const newTag = {
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: tagName,
        color: '#7c6af7' // Default color
      };
      setTags(prev => [...prev, newTag]);
    }

    setLocalTask(prev => {
      if (prev.tags.includes(tagName)) return prev;
      return { ...prev, tags: [...prev.tags, tagName] };
    });
  };

  const toggleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isCompleted = expanded ? !localTask.completed : !task.completed;
    
    if (isCompleted) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x, y },
        colors: ['#22c55e', '#7c6af7', '#ffffff'],
        disableForReducedMotion: true,
        zIndex: 100,
      });
    }

    if (expanded) {
      setLocalTask(prev => ({
        ...prev,
        completed: isCompleted,
        completedDate: isCompleted ? getLocalISOString() : undefined
      }));
    } else {
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          return { 
            ...t, 
            completed: isCompleted,
            completedDate: isCompleted ? getLocalISOString() : undefined
          };
        }
        return t;
      }));
    }
  };

  const toggleSubtask = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    
    const currentTask = expanded ? localTask : task;
    const subtask = currentTask.subtasks?.find(s => s.id === subtaskId);
    if (!subtask) return;
    
    const isCompleted = !subtask.completed;
    
    if (expanded) {
      setLocalTask(prev => ({
        ...prev,
        subtasks: prev.subtasks?.map(s => s.id === subtaskId ? { ...s, completed: isCompleted } : s) || []
      }));
    } else {
      setTasks(prev => prev.map(t => {
        if (t.id === task.id && t.subtasks) {
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: isCompleted } : s)
          };
        }
        return t;
      }));
    }
    
    if (isCompleted) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { x, y },
        colors: ['#22c55e', '#7c6af7', '#ffffff'],
        disableForReducedMotion: true,
        zIndex: 100,
      });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Create a custom drag image wrapper to support transforms (tilt)
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
    
    // Force layout calculation so the browser renders it before snapshotting
    wrapper.getBoundingClientRect();
    
    // Set the drag image to the wrapper
    e.dataTransfer.setDragImage(wrapper, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    
    // Clean up the wrapper and set dragging state
    setTimeout(() => {
      document.body.removeChild(wrapper);
      setIsDragging(true);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId && draggedId !== task.id) {
      setTasks(prev => {
        const draggedIndex = prev.findIndex(t => t.id === draggedId);
        const targetIndex = prev.findIndex(t => t.id === task.id);
        
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        
        const newTasks = [...prev];
        const [draggedTask] = newTasks.splice(draggedIndex, 1);
        
        // If we are in a project view, sync the section to the target task's section
        // This allows dragging between sections to work as expected
        const updatedDraggedTask = { 
          ...draggedTask, 
          section: task.section 
        };
        
        // Adjust target index if needed (if we removed an item before it)
        // Actually splice handles the removal, so targetIndex might refer to a different item if we don't adjust?
        // No, findIndex was on 'prev'. 
        // If draggedIndex < targetIndex, the item at targetIndex in 'prev' is now at targetIndex-1 in 'newTasks'.
        // So we should insert at targetIndex-1?
        // Let's use the logic: we want to insert *before* the target task (or after?).
        // Usually drop on top half = before, bottom half = after.
        // But here we just drop on the item. Let's insert *before* for simplicity.
        
        let insertIndex = targetIndex;
        if (draggedIndex < targetIndex) {
          insertIndex -= 1;
        }
        
        newTasks.splice(insertIndex, 0, updatedDraggedTask);
        return newTasks;
      });
    }
  };

  return (
    <div 
      draggable={!expanded && !disableDrag}
      onDragStart={disableDrag ? undefined : handleDragStart}
      onDragEnd={disableDrag ? undefined : handleDragEnd}
      onDragOver={disableDrag ? undefined : handleDragOver}
      onDragLeave={disableDrag ? undefined : handleDragLeave}
      onDrop={disableDrag ? undefined : handleDrop}
      className={`flex items-start gap-3 p-2.5 px-3.5 rounded-lg cursor-pointer transition-all relative mb-0.5 border group ${expanded ? 'bg-bg2 border-border-strong' : 'border-transparent hover:bg-bg2 hover:border-border-subtle'} ${(expanded ? localTask.completed : task.completed) ? 'opacity-60' : ''} ${isDragging ? 'opacity-30 border-dashed border-border-strong bg-transparent' : ''} ${isDragOver ? 'border-t-accent border-t-2 bg-bg3' : ''} ${isDeleting ? 'animate-disintegrate pointer-events-none' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-text-muted text-xs cursor-grab opacity-100 md:opacity-0 md:group-hover:opacity-100 mt-0.5 transition-opacity absolute left-1">⠿</div>
      <motion.div 
        className={`w-[17px] h-[17px] rounded-full border-[1.5px] shrink-0 mt-0.5 transition-colors cursor-pointer flex items-center justify-center ml-3 ${(expanded ? localTask.completed : task.completed) ? 'bg-green border-green' : 'border-text-faint hover:border-accent'}`}
        onClick={toggleCheck}
        whileTap={{ scale: 0.8 }}
        animate={(expanded ? localTask.completed : task.completed) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {(expanded ? localTask.completed : task.completed) && (
          <motion.span 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] text-white font-bold leading-none"
          >
            ✓
          </motion.span>
        )}
      </motion.div>
      <div className="flex-1 min-w-0">
        {expanded ? (
          <input 
            type="text" 
            value={localTask.title} 
            onChange={(e) => setLocalTask(prev => ({ ...prev, title: e.target.value }))}
            className="text-sm mb-[3px] bg-transparent border-none outline-none w-full text-text-main font-medium placeholder:text-text-faint"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setExpanded(false);
              }
            }}
            placeholder="Task title"
          />
        ) : (
          <div className={`text-sm mb-[3px] ${task.completed ? 'line-through text-text-faint' : 'text-text-main'}`}>{task.title}</div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {expanded ? (
            <select 
              value={localTask.priority}
              onChange={(e) => setLocalTask(prev => ({ ...prev, priority: e.target.value as Priority }))}
              onClick={(e) => e.stopPropagation()}
              className={`font-mono text-[10px] px-1.5 py-[1px] rounded font-medium border-none outline-none cursor-pointer ${priorityColors[localTask.priority]}`}
            >
              <option value="p1">P1</option>
              <option value="p2">P2</option>
              <option value="p3">P3</option>
              <option value="p4">P4</option>
            </select>
          ) : (
            <span className={`font-mono text-[10px] px-1.5 py-[1px] rounded font-medium ${priorityColors[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
          )}

          {expanded ? (
            <div className="relative flex items-center">
              <select
                value={localTask.project || ''}
                onChange={(e) => {
                  const val = e.target.value || undefined;
                  setLocalTask(prev => ({ ...prev, project: val }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-[10px] px-2 py-1 rounded border border-border-strong text-text-main bg-bg3 outline-none cursor-pointer max-w-[120px] appearance-none hover:border-accent transition-colors"
              >
                <option value="">No Project</option>
                {folders.map(f => (
                  <React.Fragment key={f.id}>
                    <option value={f.name}>{f.name} (Folder)</option>
                    {f.projects.map((p, index) => (
                      <option key={`${f.id}-${p}-${index}`} value={p}>&nbsp;&nbsp;&nbsp;{p}</option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
              <div className="absolute right-1.5 pointer-events-none text-text-faint">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          ) : (
            task.project && (
              <span className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-accent"></span>
                {task.project}
              </span>
            )
          )}

          {expanded ? (
            <div className="relative flex items-center">
              <select
                value={localTask.goalId || ''}
                onChange={(e) => setLocalTask(prev => ({ ...prev, goalId: e.target.value || undefined }))}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-[10px] px-2 py-1 rounded border border-border-strong text-text-main bg-bg3 outline-none cursor-pointer max-w-[120px] appearance-none hover:border-accent transition-colors"
              >
                <option value="">No Goal</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id} className="bg-bg text-text-main">{g.name}</option>
                ))}
              </select>
              <div className="absolute right-1.5 pointer-events-none text-text-faint">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          ) : (
            task.goalId && (
              <span className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: goals.find(g => g.id === task.goalId)?.color || '#7c6af7' }}></span>
                {goals.find(g => g.id === task.goalId)?.name || 'Goal'}
              </span>
            )
          )}

          {expanded ? (
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center group/date">
                <Calendar size={12} className="absolute left-2 text-text-faint group-hover/date:text-accent transition-colors pointer-events-none" />
                <input 
                  type="date"
                  value={localTask.dueDate || ''}
                  onChange={(e) => setLocalTask(prev => {
                    const newDate = e.target.value;
                    const newTime = newDate ? prev.dueTime : undefined;
                    return { ...prev, dueDate: newDate, dueTime: newTime };
                  })}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] pl-6 pr-2 py-1 rounded border border-border-strong text-text-main bg-bg3 outline-none hover:border-accent transition-colors cursor-pointer appearance-none min-w-[110px]"
                />
              </div>
              {localTask.dueDate && (
                <div className="relative flex items-center group/time">
                  <select 
                    value={localTask.dueTime || ''}
                    onChange={(e) => setLocalTask(prev => ({ ...prev, dueTime: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-[10px] px-2 py-1 rounded border border-border-strong text-text-main bg-bg3 outline-none hover:border-accent transition-colors cursor-pointer appearance-none pr-5"
                  >
                    <option value="" className="bg-bg2 text-text-faint">Time</option>
                    {Array.from({ length: 24 * 4 }).map((_, i) => {
                      const hour = Math.floor(i / 4).toString().padStart(2, '0');
                      const minute = ((i % 4) * 15).toString().padStart(2, '0');
                      const time = `${hour}:${minute}`;
                      return <option key={time} value={time} className="bg-bg text-text-main">{time}</option>;
                    })}
                    {localTask.dueTime && !Array.from({ length: 24 * 4 }).some((_, i) => {
                      const hour = Math.floor(i / 4).toString().padStart(2, '0');
                      const minute = ((i % 4) * 15).toString().padStart(2, '0');
                      return `${hour}:${minute}` === localTask.dueTime;
                    }) && (
                      <option value={localTask.dueTime} className="bg-bg text-text-main">{localTask.dueTime}</option>
                    )}
                  </select>
                  <div className="absolute right-1.5 pointer-events-none text-text-faint">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              )}
            </div>
          ) : (
            task.dueDate && (
              <span className={`font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong flex items-center gap-1 ${task.dueDate < getLocalDateString() && !task.completed ? 'text-red-500 border-red-500/30 bg-red-500/5' : 'text-text-faint'}`}>
                <Calendar size={10} />
                {task.dueDate === getLocalDateString() ? 'Today' : task.dueDate}
                {task.dueTime && ` at ${task.dueTime}`}
              </span>
            )
          )}

          {expanded ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {localTask.tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint flex items-center gap-1 bg-bg3">
                  {tag}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalTask(prev => ({ ...prev, tags: prev.tags.filter(tg => tg !== tag) }));
                    }}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
              
              {isAddingTag ? (
                <input
                  type="text"
                  autoFocus
                  className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint bg-transparent outline-none min-w-[60px]"
                  placeholder="New tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        handleAddTag(val);
                      }
                      setIsAddingTag(false);
                    }
                    if (e.key === 'Escape') setIsAddingTag(false);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) {
                      handleAddTag(val);
                    }
                    setIsAddingTag(false);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <select
                  className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint bg-transparent outline-none cursor-pointer max-w-[100px]"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__new__') {
                      setIsAddingTag(true);
                    } else if (val) {
                      handleAddTag(val);
                    }
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="">+ Tag</option>
                  {tags.filter(t => !localTask.tags.includes(t.name)).map(tag => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                  <option value="__new__">+ New Tag...</option>
                </select>
              )}
            </div>
          ) : (
            task.tags.map((tag, index) => (
              <span key={`${tag}-${index}`} className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint">
                {tag}
              </span>
            ))
          )}
        </div>
        
        {expanded && (
          <div className="pt-2 pb-1 pl-1" onClick={e => e.stopPropagation()}>
            {localTask.subtasks?.map(sub => (
              <div 
                key={sub.id} 
                className="flex items-center gap-2.5 p-1.5 px-2 rounded-md text-[13px] text-text-muted hover:bg-bg3 transition-colors"
                onClick={(e) => toggleSubtask(e, sub.id)}
              >
                <motion.div 
                  className={`w-[13px] h-[13px] rounded-[3px] border-[1.5px] shrink-0 flex items-center justify-center transition-colors cursor-pointer ${sub.completed ? 'bg-green border-green' : 'border-text-faint hover:border-accent'}`}
                  whileTap={{ scale: 0.8 }}
                  animate={sub.completed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {sub.completed && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[8px] text-white leading-none"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
                <input
                  type="text"
                  value={sub.title}
                  onChange={(e) => {
                    e.stopPropagation();
                    setLocalTask(prev => ({
                      ...prev,
                      subtasks: prev.subtasks?.map(s => s.id === sub.id ? { ...s, title: e.target.value } : s) || []
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex-1 bg-transparent border-none outline-none ${sub.completed ? 'line-through text-text-faint' : 'text-text-main'}`}
                  placeholder="Subtask title"
                  autoFocus={sub.title === ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setLocalTask(prev => ({
                        ...prev,
                        subtasks: [...(prev.subtasks || []), { id: Math.random().toString(36).substring(2, 9), title: '', completed: false }]
                      }));
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalTask(prev => ({
                      ...prev,
                      subtasks: prev.subtasks?.filter(s => s.id !== sub.id) || []
                    }));
                  }}
                  className="text-text-faint hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            <div 
              className="flex items-center gap-1.5 p-1.5 px-2 rounded-md text-xs text-text-faint cursor-pointer hover:text-text-muted hover:bg-bg3 transition-colors mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setLocalTask(prev => ({
                  ...prev,
                  subtasks: [...(prev.subtasks || []), { id: Math.random().toString(36).substring(2, 9), title: '', completed: false }]
                }));
              }}
            >
              <span>+</span> Add subtask
            </div>
          </div>
        )}
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className="text-[11px] text-text-faint">{task.subtasks.length} sub</span>
        </div>
      )}
      <div className={`flex items-center gap-2 shrink-0 mt-0.5 transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            duplicateTask(task.id);
          }}
          className="text-text-faint hover:text-text-main p-1 rounded hover:bg-bg3 transition-colors"
          title="Duplicate task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            isDeletingRef.current = true;
            if (expanded) setEditingTaskId(null);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, deleted: true } : t));
          }}
          className="text-text-faint hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
          title="Delete task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
};
