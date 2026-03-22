import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { useAppContext } from '../store';
import { getLocalISOString, getLocalDateString } from '../utils';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

const priorityColors: Record<Priority, string> = {
  p1: 'text-error bg-error/10',
  p2: 'text-warning bg-warning/10',
  p3: 'text-primary bg-primary/10',
  p4: 'text-on-surface-variant bg-surface-variant/50',
};

export const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { tasks, setTasks, folders, duplicateTask, tags, setTags, goals, editingTaskId, setEditingTaskId } = useAppContext();
  const expanded = editingTaskId === task.id;
  
  const [localTask, setLocalTask] = useState<Task>(task);
  const prevExpandedRef = React.useRef(expanded);
  const isDeletingRef = React.useRef(false);

  // Sync local task when entering edit mode
  React.useEffect(() => {
    if (expanded && !prevExpandedRef.current) {
      setLocalTask(task);
    }
  }, [expanded, task]);

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
        color: '#cdbdff' // Default color
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
        colors: ['#cdbdff', '#7c6af7', '#ffffff'],
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
        colors: ['#cdbdff', '#7c6af7', '#ffffff'],
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
        
        const updatedDraggedTask = { 
          ...draggedTask, 
          section: task.section 
        };
        
        let insertIndex = targetIndex;
        if (draggedIndex < targetIndex) {
          insertIndex -= 1;
        }
        
        newTasks.splice(insertIndex, 0, updatedDraggedTask);
        return newTasks;
      });
    }
  };

  const isOverdue = task.dueDate && task.dueDate < getLocalDateString() && !task.completed;

  return (
    <div 
      draggable={!expanded}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex items-start gap-3 p-3 px-4 rounded-2xl cursor-pointer transition-all relative mb-1.5 border group ${expanded ? 'bg-surface-container-high border-outline-variant shadow-xl z-10' : 'border-transparent hover:bg-surface-container-high hover:border-outline-variant/30'} ${(expanded ? localTask.completed : task.completed) ? 'opacity-50' : ''} ${isDragging ? 'opacity-30 border-dashed border-outline-variant bg-transparent' : ''} ${isDragOver ? 'border-t-primary border-t-2 bg-surface-container-high' : ''} ${isDeleting ? 'animate-disintegrate pointer-events-none' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-on-surface-variant/30 text-xs cursor-grab opacity-100 md:opacity-0 md:group-hover:opacity-100 mt-1 transition-opacity absolute left-1.5">
        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
      </div>

      <motion.div 
        className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-all cursor-pointer flex items-center justify-center ml-4 ${(expanded ? localTask.completed : task.completed) ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'border-outline hover:border-primary'}`}
        onClick={toggleCheck}
        whileTap={{ scale: 0.8 }}
        animate={(expanded ? localTask.completed : task.completed) ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {(expanded ? localTask.completed : task.completed) && (
          <motion.span 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="material-symbols-outlined text-[14px] text-on-primary font-bold"
          >
            check
          </motion.span>
        )}
      </motion.div>

      <div className="flex-1 min-w-0">
        {expanded ? (
          <input 
            type="text" 
            value={localTask.title} 
            onChange={(e) => setLocalTask(prev => ({ ...prev, title: e.target.value }))}
            className="text-sm mb-1 bg-transparent border-none outline-none w-full text-on-surface font-bold placeholder:text-on-surface-variant/40"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setExpanded(false);
              }
            }}
            placeholder="What needs to be done?"
          />
        ) : (
          <div className={`text-sm mb-1 font-medium ${task.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
            {task.title}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-1">
          {expanded ? (
            <select 
              value={localTask.priority}
              onChange={(e) => setLocalTask(prev => ({ ...prev, priority: e.target.value as Priority }))}
              onClick={(e) => e.stopPropagation()}
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border-none outline-none cursor-pointer transition-colors ${priorityColors[localTask.priority]}`}
            >
              <option value="p1">P1 Critical</option>
              <option value="p2">P2 High</option>
              <option value="p3">P3 Medium</option>
              <option value="p4">P4 Low</option>
            </select>
          ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityColors[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
          )}

          {expanded ? (
            <select
              value={localTask.project || ''}
              onChange={(e) => setLocalTask(prev => ({ ...prev, project: e.target.value || undefined }))}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant text-on-surface-variant bg-surface-variant/30 outline-none cursor-pointer max-w-[120px]"
            >
              <option value="">No Project</option>
              {folders.map(f => (
                <optgroup key={f.id} label={f.name}>
                  {f.projects.map((p, index) => (
                    <option key={`${f.id}-${p}-${index}`} value={p}>{p}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          ) : (
            task.project && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant/30 text-on-surface-variant bg-surface-variant/20">
                {task.project}
              </span>
            )
          )}

          {expanded ? (
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2 text-[14px] text-on-surface-variant pointer-events-none">calendar_today</span>
                <input 
                  type="date"
                  value={localTask.dueDate || ''}
                  onChange={(e) => setLocalTask(prev => {
                    const newDate = e.target.value;
                    const newTime = newDate ? prev.dueTime : undefined;
                    return { ...prev, dueDate: newDate, dueTime: newTime };
                  })}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] pl-7 pr-2 py-0.5 rounded-full border border-outline-variant text-on-surface-variant bg-surface-variant/30 outline-none hover:border-primary transition-colors cursor-pointer"
                />
              </div>
              {localTask.dueDate && (
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2 text-[14px] text-on-surface-variant pointer-events-none">schedule</span>
                  <select 
                    value={localTask.dueTime || ''}
                    onChange={(e) => setLocalTask(prev => ({ ...prev, dueTime: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] pl-7 pr-6 py-0.5 rounded-full border border-outline-variant text-on-surface-variant bg-surface-variant/30 outline-none appearance-none cursor-pointer hover:border-primary transition-colors"
                  >
                    <option value="" className="bg-surface-container-high">Time</option>
                    {Array.from({ length: 24 * 4 }).map((_, i) => {
                      const hour = Math.floor(i / 4).toString().padStart(2, '0');
                      const minute = ((i % 4) * 15).toString().padStart(2, '0');
                      const time = `${hour}:${minute}`;
                      return <option key={time} value={time} className="bg-surface-container-high">{time}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>
          ) : (
            task.dueDate && (
              <span className={`text-[10px] flex items-center gap-1 font-bold ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[14px]">{isOverdue ? 'event_busy' : 'event'}</span>
                {task.dueDate} {task.dueTime || ''}
              </span>
            )
          )}

          <div className="flex items-center gap-1 flex-wrap">
            {expanded ? (
              <>
                {localTask.tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    #{tag}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalTask(prev => ({ ...prev, tags: prev.tags.filter(tg => tg !== tag) }));
                      }}
                      className="material-symbols-outlined text-[12px] hover:text-error transition-colors"
                    >
                      close
                    </button>
                  </span>
                ))}
                
                {isAddingTag ? (
                  <input
                    type="text"
                    autoFocus
                    className="text-[10px] px-2 py-0.5 rounded-full border border-primary text-on-surface bg-transparent outline-none min-w-[80px]"
                    placeholder="Tag name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) handleAddTag(val);
                        setIsAddingTag(false);
                      }
                      if (e.key === 'Escape') setIsAddingTag(false);
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val) handleAddTag(val);
                      setIsAddingTag(false);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingTag(true);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant border-dashed text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                  >
                    + Tag
                  </button>
                )}
              </>
            ) : (
              task.tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="text-[10px] text-on-surface-variant/60">
                  #{tag}
                </span>
              ))
            )}
          </div>
        </div>
        
        {expanded && (
          <div className="mt-4 space-y-1" onClick={e => e.stopPropagation()}>
            <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-2 ml-1">Subtasks</div>
            {localTask.subtasks?.map(sub => (
              <div 
                key={sub.id} 
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-variant/20 transition-all group/subtask"
                onClick={(e) => toggleSubtask(e, sub.id)}
              >
                <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${sub.completed ? 'bg-primary border-primary' : 'border-outline group-hover/subtask:border-primary'}`}>
                  {sub.completed && <span className="material-symbols-outlined text-[12px] text-on-primary font-bold">check</span>}
                </div>
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
                  className={`flex-1 bg-transparent border-none outline-none text-xs ${sub.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}
                  placeholder="New subtask..."
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
                  className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover/subtask:opacity-100 hover:text-error transition-all"
                >
                  delete
                </button>
              </div>
            ))}
            <button 
              className="flex items-center gap-2 p-2 px-3 rounded-xl text-[11px] text-primary font-bold hover:bg-primary/10 transition-all mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setLocalTask(prev => ({
                  ...prev,
                  subtasks: [...(prev.subtasks || []), { id: Math.random().toString(36).substring(2, 9), title: '', completed: false }]
                }));
              }}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add subtask
            </button>
          </div>
        )}
      </div>

      <div className={`flex items-center gap-1 shrink-0 mt-0.5 transition-all ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            duplicateTask(task.id);
          }}
          className="p-1.5 text-on-surface-variant hover:text-primary rounded-xl hover:bg-primary/10 transition-all"
          title="Duplicate"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            isDeletingRef.current = true;
            if (expanded) setEditingTaskId(null);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, deleted: true } : t));
          }}
          className="p-1.5 text-on-surface-variant hover:text-error rounded-xl hover:bg-error/10 transition-all"
          title="Delete"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
};
