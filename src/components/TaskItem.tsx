import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { useAppContext } from '../store';
import { getLocalISOString } from '../utils';

const priorityColors: Record<Priority, string> = {
  p1: 'text-p1 bg-p1/10',
  p2: 'text-p2 bg-p2/10',
  p3: 'text-p3 bg-p3/10',
  p4: 'text-p4 bg-p4/10',
};

export const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { tasks, setTasks, folders, duplicateTask, tags, setTags } = useAppContext();
  const [expanded, setExpanded] = useState(false);
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

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, tags: [...t.tags, tagName] } : t));
  };

  const toggleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        const isCompleted = !t.completed;
        return { 
          ...t, 
          completed: isCompleted,
          completedDate: isCompleted ? getLocalISOString() : undefined
        };
      }
      return t;
    }));
  };

  const toggleSubtask = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => {
      if (t.id === task.id && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
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
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex items-start gap-3 p-2.5 px-3.5 rounded-lg cursor-pointer transition-all relative mb-0.5 border group ${expanded ? 'bg-bg2 border-border-strong' : 'border-transparent hover:bg-bg2 hover:border-border-subtle'} ${task.completed ? 'opacity-60' : ''} ${isDragging ? 'opacity-30 border-dashed border-border-strong bg-transparent' : ''} ${isDragOver ? 'border-t-accent border-t-2 bg-bg3' : ''} ${isDeleting ? 'animate-disintegrate pointer-events-none' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-text-muted text-xs cursor-grab opacity-100 md:opacity-0 md:group-hover:opacity-100 mt-0.5 transition-opacity absolute left-1">⠿</div>
      <div 
        className={`w-[17px] h-[17px] rounded-full border-[1.5px] shrink-0 mt-0.5 transition-all cursor-pointer flex items-center justify-center ml-3 ${task.completed ? 'bg-green border-green' : 'border-text-faint hover:border-accent'}`}
        onClick={toggleCheck}
      >
        {task.completed && <span className="text-[10px] text-white font-bold leading-none">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        {expanded ? (
          <input 
            type="text" 
            value={task.title} 
            onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: e.target.value } : t))}
            className="text-sm mb-[3px] bg-transparent border-none outline-none w-full text-text-main font-medium placeholder:text-text-faint"
            onClick={(e) => e.stopPropagation()}
            placeholder="Task title"
          />
        ) : (
          <div className={`text-sm mb-[3px] ${task.completed ? 'line-through text-text-faint' : 'text-text-main'}`}>{task.title}</div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {expanded ? (
            <select 
              value={task.priority}
              onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority: e.target.value as Priority } : t))}
              onClick={(e) => e.stopPropagation()}
              className={`font-mono text-[10px] px-1.5 py-[1px] rounded font-medium border-none outline-none cursor-pointer ${priorityColors[task.priority]}`}
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
            <select
              value={task.project || ''}
              onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, project: e.target.value || undefined } : t))}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint bg-transparent outline-none cursor-pointer max-w-[100px]"
            >
              <option value="">No Project</option>
              {folders.flatMap(f => f.projects).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            task.project && (
              <span className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint">
                {task.project}
              </span>
            )
          )}

          {expanded ? (
            <input 
              type="date"
              value={task.dueDate || ''}
              onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, dueDate: e.target.value } : t))}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint bg-transparent outline-none"
            />
          ) : (
            task.dueDate && (
              <span className={`font-mono text-[10px] flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red' : 'text-text-muted'}`}>
                ⏰ {task.dueDate} {task.dueTime || ''}
              </span>
            )
          )}

          {expanded ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.tags.map(tag => (
                <span key={tag} className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint flex items-center gap-1 bg-bg3">
                  {tag}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, tags: t.tags.filter(tg => tg !== tag) } : t));
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
                  {tags.filter(t => !task.tags.includes(t.name)).map(tag => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                  <option value="__new__">+ New Tag...</option>
                </select>
              )}
            </div>
          ) : (
            task.tags.map(tag => (
              <span key={tag} className="font-mono text-[10px] px-1.5 py-[1px] rounded border border-border-strong text-text-faint">
                {tag}
              </span>
            ))
          )}
        </div>
        
        {expanded && (
          <div className="pt-2 pb-1 pl-1" onClick={e => e.stopPropagation()}>
            {task.subtasks?.map(sub => (
              <div 
                key={sub.id} 
                className="flex items-center gap-2.5 p-1.5 px-2 rounded-md text-[13px] text-text-muted cursor-pointer hover:bg-bg3 transition-colors"
                onClick={(e) => toggleSubtask(e, sub.id)}
              >
                <div className={`w-[13px] h-[13px] rounded-[3px] border-[1.5px] shrink-0 flex items-center justify-center transition-all ${sub.completed ? 'bg-green border-green' : 'border-text-faint hover:border-accent'}`}>
                  {sub.completed && <span className="text-[8px] text-white leading-none">✓</span>}
                </div>
                <span className={sub.completed ? 'line-through text-text-faint' : ''}>{sub.title}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-md text-xs text-text-faint cursor-pointer hover:text-text-muted hover:bg-bg3 transition-colors mt-1">
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
