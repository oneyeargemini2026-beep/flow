import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Brain, Flame } from 'lucide-react';
import { useAppContext } from '../store';
import { TaskItem } from './TaskItem';
import { getLocalDateString, parseTaskInput } from '../utils';
import { HexColorPicker } from 'react-colorful';
import { Archive, MatrixQuadrant } from '../types';

const CircularProgress = ({ completed, total }: { completed: number; total: number }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const dashoffset = circumference * (1 - progress);
  
  return (
    <div className="flex flex-col items-center justify-center mb-8 bg-surface-container-high/30 p-8 rounded-[32px] border border-outline-variant/20">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-surface-variant"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="var(--color-primary)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-headline font-extrabold text-on-surface">{Math.round(progress * 100)}%</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em] mb-1">Daily Completion</div>
        <div className="text-sm font-headline font-bold text-on-surface">{completed} of {total} tasks finished</div>
      </div>
    </div>
  );
};

export const GoalsView = () => {
  const { goals, setGoals, tasks } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#7c6af7');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalName, setEditingGoalName] = useState('');

  const todayStr = getLocalDateString();

  const handleAddGoal = () => {
    if (!newGoalName.trim()) return;
    const newGoal = {
      id: `goal-${Date.now()}`,
      name: newGoalName.trim(),
      color: newGoalColor,
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [...prev, newGoal]);
    setNewGoalName('');
    setIsAdding(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface">Goals</h2>
        <button 
          className="flex items-center gap-2 bg-primary text-on-primary p-3 px-6 rounded-2xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          onClick={() => setIsAdding(true)}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>New Goal</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 mb-10 shadow-xl shadow-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-4 h-4 rounded-full ring-2 ring-offset-4 ring-offset-surface-container-high" style={{ backgroundColor: newGoalColor }}></div>
            <input 
              autoFocus
              type="text" 
              placeholder="What's your long-term objective?" 
              className="flex-1 bg-transparent border-none outline-none text-on-surface text-lg font-headline font-extrabold placeholder:text-on-surface-variant/20"
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
            <div className="flex gap-2">
              {['#ffb4ab', '#cdbdff', '#7dffa2', '#d3c5ad', '#919096', '#ffffff'].map(c => (
                <button 
                  key={c}
                  onClick={() => setNewGoalColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${newGoalColor === c ? 'ring-2 ring-offset-2 ring-offset-surface-container-high ring-on-surface' : 'opacity-40 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAdding(false)} 
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddGoal} 
                className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const linkedTasks = tasks.filter(t => t.goalId === goal.id && !t.deleted);
          const completedTasks = linkedTasks.filter(t => t.completed);
          const pendingTasks = linkedTasks.filter(t => !t.completed);
          
          const progress = linkedTasks.length > 0 ? (completedTasks.length / linkedTasks.length) * 100 : 0;
          
          const completedToday = tasks.some(t => 
            t.goalId === goal.id && 
            t.completed && 
            t.completedDate && 
            t.completedDate.startsWith(todayStr)
          );

          return (
            <div key={goal.id} className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 flex flex-col shadow-xl shadow-black/10 group hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full ring-2 ring-offset-4 ring-offset-surface-container-high" style={{ backgroundColor: goal.color }}></div>
                  {editingGoalId === goal.id ? (
                    <input 
                      autoFocus
                      className="text-xl font-headline font-extrabold bg-transparent border-b border-primary outline-none text-on-surface w-full"
                      value={editingGoalName}
                      onChange={e => setEditingGoalName(e.target.value)}
                      onBlur={() => {
                        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, name: editingGoalName } : g));
                        setEditingGoalId(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, name: editingGoalName } : g));
                          setEditingGoalId(null);
                        }
                      }}
                    />
                  ) : (
                    <h3 
                      className="text-xl font-headline font-extrabold text-on-surface cursor-pointer group-hover:text-primary transition-colors"
                      onClick={() => {
                        setEditingGoalId(goal.id);
                        setEditingGoalName(goal.name);
                      }}
                    >
                      {goal.name}
                    </h3>
                  )}
                </div>
                <button 
                  className="material-symbols-outlined text-on-surface-variant/20 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  delete
                </button>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Overall Progress</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${completedToday ? 'bg-success/10 text-success' : 'bg-surface-variant text-on-surface-variant/40'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {completedToday ? 'check_circle' : 'schedule'}
                  </span>
                  {completedToday ? 'Progress made today' : 'No progress today'}
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                  {pendingTasks.length} pending
                </span>
              </div>

              <div className="mt-auto pt-6 border-t border-outline-variant/10">
                <div className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest mb-4">Focus Tasks</div>
                <div className="space-y-3">
                  {pendingTasks.slice(0, 2).map(t => (
                    <div key={t.id} className="flex items-center gap-3 group/task">
                      <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/40 group-hover/task:bg-primary transition-colors"></div>
                      <span className="text-sm font-medium text-on-surface-variant/60 group-hover/task:text-on-surface transition-colors truncate">{t.title}</span>
                    </div>
                  ))}
                  {pendingTasks.length > 2 && (
                    <div className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest ml-4">
                      +{pendingTasks.length - 2} more tasks
                    </div>
                  )}
                  {pendingTasks.length === 0 && (
                    <div className="text-xs font-medium text-on-surface-variant/20 italic">No pending tasks linked.</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && !isAdding && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-surface-container-high rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-black/10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">ads_click</span>
            </div>
            <h3 className="text-xl font-headline font-extrabold text-on-surface mb-2">No goals set yet</h3>
            <p className="text-sm font-medium text-on-surface-variant/40">Define your long-term objectives to stay focused.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectView = () => {
  const { tasks, setTasks, activeProject, tags: globalTags, setTags: setGlobalTags, renameProject, folders } = useAppContext();
  
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState('');

  const projectTasks = tasks.filter(t => t.project === activeProject && !t.deleted);

  const sortTasks = (tasksToSort: typeof tasks) => {
    return [...tasksToSort].sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  };

  const handleRenameProject = (newName: string) => {
    const trimmedNewName = newName.trim();
    if (activeProject && trimmedNewName && trimmedNewName !== activeProject) {
      const projectExists = folders.some(f => f.projects.includes(trimmedNewName));
      if (!projectExists) {
        renameProject(activeProject, trimmedNewName);
      }
    }
    setIsEditingProject(false);
  };

  const incompleteTasks = sortTasks(projectTasks.filter(t => !t.completed));
  const completedTasks = sortTasks(projectTasks.filter(t => t.completed));

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const input = e.currentTarget.value.trim();
      const { title, tags } = parseTaskInput(input);

      tags.forEach(tagName => {
        if (!globalTags.find(t => t.name === tagName)) {
          const newTag = {
            id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: tagName,
            color: '#cdbdff'
          };
          setGlobalTags(prev => [...prev, newTag]);
        }
      });

      setTasks(prev => [{
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        priority: 'p4',
        tags,
        completed: false,
        isInbox: false,
        dueDate: getLocalDateString(),
        project: activeProject
      }, ...prev]);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container">
      <div className="flex items-center gap-4 p-4 px-6 border-b border-outline-variant/10 shrink-0 h-16 bg-surface-container/50 backdrop-blur-md">
        {isEditingProject ? (
          <input
            autoFocus
            type="text"
            value={editedProjectName}
            onChange={(e) => setEditedProjectName(e.target.value)}
            onBlur={(e) => handleRenameProject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameProject(e.currentTarget.value);
              if (e.key === 'Escape') setIsEditingProject(false);
            }}
            className="text-xl font-headline font-extrabold bg-transparent border-none outline-none text-on-surface w-full"
          />
        ) : (
          <>
            <h2 
              className="text-xl font-headline font-extrabold text-on-surface cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                setEditedProjectName(activeProject || '');
                setIsEditingProject(true);
              }}
            >
              {activeProject}
            </h2>
            <button
              onClick={() => {
                setEditedProjectName(activeProject || '');
                setIsEditingProject(true);
              }}
              className="opacity-0 group-hover/project-title:opacity-100 text-on-surface-variant/40 hover:text-on-surface transition-all ml-2"
              title="Rename project"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </>
        )}
        <span className="text-[10px] font-bold text-on-surface-variant/20 bg-surface-variant px-3 py-1 rounded-full tracking-widest uppercase ml-auto">
          {incompleteTasks.length} tasks
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-4 flex items-center gap-4 mb-12 shadow-xl shadow-black/10 focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-primary text-2xl">add</span>
            <input 
              type="text" 
              placeholder={`Add task to ${activeProject}...`} 
              className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm font-medium placeholder:text-on-surface-variant/40"
              onKeyDown={handleAddTask}
            />
          </div>
          
          {(() => {
            const sections = Array.from(new Set(incompleteTasks.map(t => t.section || '')));
            sections.sort((a, b) => {
                if (!a) return -1;
                if (!b) return 1;
                return a.localeCompare(b);
            });

            return sections.map(section => {
              const sectionTasks = incompleteTasks.filter(t => (t.section || '') === section);
              if (sectionTasks.length === 0 && !section) return null;

              return (
                <div 
                  key={section || 'unsectioned'} 
                  className="mb-12"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (draggedId) {
                      setTasks(prev => prev.map(t => {
                        if (t.id === draggedId) {
                          if ((t.section || '') !== section) {
                            return { ...t, section: section || undefined };
                          }
                        }
                        return t;
                      }));
                    }
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/20">{section || 'ACTIVE TASKS'}</h3>
                    <div className="flex-1 h-[1px] bg-outline-variant/10"></div>
                  </div>
                  <div className="space-y-3">
                    {sectionTasks.map(t => <TaskItem key={t.id} task={t} />)}
                  </div>
                </div>
              );
            });
          })()}

          <div className="mt-4 mb-16">
            <input 
              type="text" 
              placeholder="+ Add section..." 
              className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/20 hover:text-primary transition-colors px-4"
              onKeyDown={e => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const sectionName = e.currentTarget.value.trim();
                  setTasks(prev => [{
                    id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: `New task in ${sectionName}`,
                    priority: 'p4',
                    tags: [],
                    completed: false,
                    project: activeProject,
                    section: sectionName,
                    isInbox: false,
                    dueDate: getLocalDateString()
                  }, ...prev]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {completedTasks.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/20">Completed</h3>
                <div className="flex-1 h-[1px] bg-outline-variant/10"></div>
                <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-3 py-1 rounded-full">{completedTasks.length}</span>
              </div>
              <div className="space-y-3">
                {completedTasks.map(t => <TaskItem key={t.id} task={t} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TodayView = () => {
  const { tasks, setTasks, tags: globalTags, setTags: setGlobalTags } = useAppContext();
  
  const baseTasks = tasks.filter(t => !t.isInbox && !t.deleted);

  const sortTasks = (tasksToSort: typeof tasks) => {
    return [...tasksToSort].sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  };

  const overdue = sortTasks(baseTasks.filter(t => !t.completed && t.dueDate && t.dueDate < getLocalDateString()));
  const today = baseTasks.filter(t => !t.completed && (t.dueDate === getLocalDateString()));
  const completed = sortTasks(baseTasks.filter(t => t.completed && t.completedDate && t.completedDate.startsWith(getLocalDateString())));
  
  const totalTasks = overdue.length + today.length + completed.length;
  const completedCount = completed.length;

  const handleBrainDump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const input = e.currentTarget.value.trim();
      const { title, tags } = parseTaskInput(input);

      tags.forEach(tagName => {
        if (!globalTags.find(t => t.name === tagName)) {
          const newTag = {
            id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: tagName,
            color: '#cdbdff'
          };
          setGlobalTags(prev => [...prev, newTag]);
        }
      });

      setTasks(prev => [{
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        priority: 'p4',
        tags,
        completed: false,
        isInbox: false,
        dueDate: getLocalDateString(),
        project: undefined
      }, ...prev]);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
      <CircularProgress completed={completedCount} total={totalTasks} />
      
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-3xl p-4 flex items-center gap-4 mb-8 shadow-xl shadow-black/10 focus-within:border-primary/50 transition-all">
        <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
        <input 
          type="text" 
          placeholder="Brain dump anything here… press Enter to capture" 
          className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm font-medium placeholder:text-on-surface-variant/40"
          onKeyDown={handleBrainDump}
        />
        <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-3 py-1 rounded-full tracking-widest uppercase">Inbox</span>
      </div>

      {overdue.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-error">Overdue</h3>
            <div className="flex-1 h-[1px] bg-error/10"></div>
            <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">{overdue.length}</span>
          </div>
          <div className="space-y-1">
            {overdue.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Today</h3>
          <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full tracking-wider">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-2 py-0.5 rounded-full">{today.length}</span>
        </div>
        <div className="space-y-1">
          {today.map(t => <TaskItem key={t.id} task={t} />)}
          {today.length === 0 && overdue.length === 0 && (
            <div className="text-center py-12 bg-surface-container-high/20 rounded-3xl border border-dashed border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-2">task_alt</span>
              <p className="text-sm text-on-surface-variant/40 font-medium">All clear for today!</p>
            </div>
          )}
        </div>
      </div>

      {completed.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Completed Today</h3>
            <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
            <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-2 py-0.5 rounded-full">{completed.length}</span>
          </div>
          <div className="space-y-1">
            {completed.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export const InboxView = () => {
  const { tasks, setTasks, setIsProcessInboxOpen } = useAppContext();
  const inboxTasks = tasks.filter(t => t.isInbox && !t.completed && !t.deleted).sort((a, b) => a.title.localeCompare(b.title));
  const [activeTab, setActiveTab] = React.useState<'capture' | 'process'>('capture');

  const handleInboxCapture = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitTask(e.currentTarget.value);
      e.currentTarget.value = '';
    }
  };

  const submitTask = (title: string) => {
    if (title.trim()) {
      setTasks(prev => [{
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        priority: 'p4',
        tags: [],
        completed: false,
        isInbox: true
      }, ...prev]);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-8 px-8 border-b border-outline-variant/20 shrink-0 h-16">
        <button 
          className={`h-full text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'capture' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/40 hover:text-on-surface'}`}
          onClick={() => setActiveTab('capture')}
        >
          Capture
        </button>
        <button 
          className={`h-full text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'process' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/40 hover:text-on-surface'}`}
          onClick={() => setActiveTab('process')}
        >
          Process ({inboxTasks.length})
        </button>
      </div>

      {activeTab === 'capture' ? (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 mb-8 shadow-xl shadow-black/10">
            <textarea 
              placeholder="Dump everything on your mind here. Don't filter, don't organize — just capture.&#10;&#10;Press Enter to add each item to Uncategorized…" 
              className="w-full bg-transparent border-none outline-none text-on-surface text-base font-medium resize-none min-h-[120px] placeholder:text-on-surface-variant/20"
              onKeyDown={handleInboxCapture}
              id="inbox-capture-textarea"
            ></textarea>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
              <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{inboxTasks.length} unsorted items</span>
              <button 
                className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                onClick={() => {
                  const textarea = document.getElementById('inbox-capture-textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    submitTask(textarea.value);
                    textarea.value = '';
                    textarea.focus();
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Uncategorized</h3>
            <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
            <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-2 py-0.5 rounded-full">{inboxTasks.length}</span>
          </div>
          <div className="space-y-1">
            {inboxTasks.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          {inboxTasks.length > 0 ? (
            <div className="max-w-md">
              <div className="w-24 h-24 bg-surface-container-high rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-black/10">
                <span className="material-symbols-outlined text-5xl text-warning">inbox</span>
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-4">Ready to process?</h3>
              <p className="text-sm font-medium text-on-surface-variant/60 mb-8 leading-relaxed">
                You have {inboxTasks.length} items in your inbox. Processing involves deciding if they are actionable, assigning projects, and setting dates.
              </p>
              <button 
                className="px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mx-auto"
                onClick={() => setIsProcessInboxOpen(true)}
              >
                Start Processing <span className="material-symbols-outlined">bolt</span>
              </button>
            </div>
          ) : (
            <div className="max-w-md">
              <div className="w-24 h-24 bg-surface-container-high rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-black/10">
                <span className="material-symbols-outlined text-5xl text-primary">auto_awesome</span>
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-4">Inbox Zero</h3>
              <p className="text-sm font-medium text-on-surface-variant/60">
                Your inbox is empty. Great job!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DashboardView = () => {
  const { tasks, setIsProcessInboxOpen } = useAppContext();
  
  const todayStr = getLocalDateString();
  const todayTasks = tasks.filter(t => !t.isInbox && !t.deleted && (!t.dueDate || t.dueDate <= todayStr));
  const completedToday = todayTasks.filter(t => t.completed);
  const inboxTasks = tasks.filter(t => t.isInbox && !t.completed && !t.deleted);
  
  const p1 = tasks.filter(t => !t.completed && !t.deleted && t.priority === 'p1').length;
  const p2 = tasks.filter(t => !t.completed && !t.deleted && t.priority === 'p2').length;
  const p3 = tasks.filter(t => !t.completed && !t.deleted && t.priority === 'p3').length;
  const p4 = tasks.filter(t => !t.completed && !t.deleted && t.priority === 'p4').length;

  const pct = todayTasks.length ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 content-start max-w-6xl mx-auto w-full">
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 shadow-xl shadow-black/10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 mb-4">Completed Today</div>
        <div className="text-5xl font-headline font-extrabold text-on-surface leading-none mb-2">{completedToday.length}</div>
        <div className="text-xs font-medium text-on-surface-variant/60 mb-4">of {todayTasks.length} tasks</div>
        <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 shadow-xl shadow-black/10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 mb-4">Focus Time</div>
        <div className="text-5xl font-headline font-extrabold text-on-surface leading-none mb-2">0<span className="text-2xl text-on-surface-variant/40">h</span> 0<span className="text-2xl text-on-surface-variant/40">m</span></div>
        <div className="text-xs font-medium text-on-surface-variant/60 mb-4">0 pomodoro sessions</div>
        <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-secondary rounded-full w-0"></div>
        </div>
      </div>

      <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 shadow-xl shadow-black/10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 mb-4">Weekly Streak</div>
        <div className="text-5xl font-headline font-extrabold text-on-surface leading-none mb-2">0</div>
        <div className="text-xs font-medium text-on-surface-variant/60 mb-4">days active</div>
        <div className="flex gap-1.5 mt-4 items-end h-12">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 h-3 bg-surface-variant rounded-full"></div>
          ))}
        </div>
      </div>
      
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-8 col-span-1 md:col-span-2 shadow-xl shadow-black/10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 mb-6">Priority Breakdown</div>
        <div className="flex gap-8">
          <div className="flex-1 text-center">
            <div className="text-4xl font-headline font-extrabold text-error mb-1">{p1}</div>
            <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Critical</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-4xl font-headline font-extrabold text-warning mb-1">{p2}</div>
            <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">High</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-4xl font-headline font-extrabold text-primary mb-1">{p3}</div>
            <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Medium</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-4xl font-headline font-extrabold text-on-surface-variant/40 mb-1">{p4}</div>
            <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Low</div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-8 col-span-1 md:col-span-2 lg:col-span-1 shadow-xl shadow-black/10 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 mb-4">Inbox</div>
          <div className="text-5xl font-headline font-extrabold text-warning leading-none mb-2">{inboxTasks.length}</div>
          <div className="text-xs font-medium text-on-surface-variant/60">items need processing</div>
        </div>
        <button 
          className="w-full mt-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all bg-surface-variant text-on-surface hover:bg-primary hover:text-on-primary flex items-center justify-center gap-2"
          onClick={() => setIsProcessInboxOpen(true)}
        >
          Process now <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export const MatrixView = () => {
  const { tasks, matrixConfig, setMatrixConfig } = useAppContext();
  const [editingQuadrant, setEditingQuadrant] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);

  const quadrants = [
    { id: 'q1', priority: 'p1', ...matrixConfig.q1 },
    { id: 'q2', priority: 'p2', ...matrixConfig.q2 },
    { id: 'q3', priority: 'p3', ...matrixConfig.q3 },
    { id: 'q4', priority: 'p4', ...matrixConfig.q4 }
  ];

  const handleSave = (id: string, field: 'title' | 'subtitle') => {
    setMatrixConfig(prev => ({
      ...prev,
      [id]: { ...prev[id as keyof typeof prev], [field]: editValue }
    }));
    setEditingQuadrant(null);
    setEditingField(null);
  };

  const handleColorChange = (id: string, color: string) => {
    setMatrixConfig(prev => ({
      ...prev,
      [id]: { ...prev[id as keyof typeof prev], color }
    }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container">
      <div className="p-4 px-6 border-b border-outline-variant/10 flex gap-3 items-center shrink-0 bg-surface-container/50 backdrop-blur-md">
        <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">info</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Eisenhower Matrix — Click titles or subtitles to edit · Click color dot to recolor</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 gap-[1px] flex-1 overflow-y-auto md:overflow-hidden bg-outline-variant/10">
        {quadrants.map(q => (
          <div key={q.id} className="bg-surface-container p-6 overflow-y-auto flex flex-col gap-3 relative group/quadrant">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="relative inline-block">
                  {editingQuadrant === q.id && editingField === 'title' ? (
                    <input
                      autoFocus
                      className="text-xl font-headline font-extrabold bg-transparent border-none outline-none text-on-surface w-full border-b-2 border-primary"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleSave(q.id, 'title')}
                      onKeyDown={e => e.key === 'Enter' && handleSave(q.id, 'title')}
                    />
                  ) : (
                    <div 
                      className="text-xl font-headline font-extrabold outline-none cursor-pointer border-b-2 border-transparent hover:border-on-surface-variant/20 inline-block min-w-[20px] transition-all"
                      style={{ color: q.color }}
                      onClick={() => {
                        setEditingQuadrant(q.id);
                        setEditingField('title');
                        setEditValue(q.title);
                      }}
                    >
                      {q.title}
                    </div>
                  )}
                </div>
                <div className="mt-1">
                  {editingQuadrant === q.id && editingField === 'subtitle' ? (
                    <input
                      autoFocus
                      className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 bg-transparent border-none outline-none w-full border-b border-primary"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleSave(q.id, 'subtitle')}
                      onKeyDown={e => e.key === 'Enter' && handleSave(q.id, 'subtitle')}
                    />
                  ) : (
                    <div 
                      className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 outline-none cursor-pointer block hover:text-on-surface transition-colors"
                      onClick={() => {
                        setEditingQuadrant(q.id);
                        setEditingField('subtitle');
                        setEditValue(q.subtitle);
                      }}
                    >
                      {q.subtitle}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-outline-variant/30 cursor-pointer shrink-0 transition-all hover:scale-110 hover:shadow-lg"
                  style={{ backgroundColor: q.color, boxShadow: `0 0 15px ${q.color}40` }}
                  onClick={() => setColorPickerOpen(colorPickerOpen === q.id ? null : q.id)}
                ></div>
                {colorPickerOpen === q.id && (
                  <div className="absolute top-10 right-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="fixed inset-0" onClick={() => setColorPickerOpen(null)}></div>
                    <div className="relative bg-surface-container-high border border-outline-variant/30 rounded-3xl p-4 shadow-2xl shadow-black/40">
                      <HexColorPicker color={q.color} onChange={(c) => handleColorChange(q.id, c)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {tasks.filter(t => !t.completed && !t.deleted && t.priority === q.priority).sort((a, b) => a.title.localeCompare(b.title)).map(t => (
                <TaskItem key={t.id} task={t} />
              ))}
              {tasks.filter(t => !t.completed && !t.deleted && t.priority === q.priority).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                  <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Clear</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ArchiveView = () => {
  const { archives, setArchives } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newArchiveName, setNewArchiveName] = useState('');
  const [newArchiveQuarter, setNewArchiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'tags' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);

  const quarters = ['q1', 'q2', 'q3', 'q4'] as const;

  const handleAddArchive = () => {
    if (!newArchiveName.trim()) return;
    const newArchive: Archive = {
      id: `arch-${Date.now()}`,
      name: newArchiveName.trim(),
      color: '#7c6af7',
      start: getLocalDateString(),
      end: getLocalDateString(),
      tasks: 0,
      completed: 0,
      tags: [],
      quarter: newArchiveQuarter,
      items: []
    };
    setArchives(prev => [...prev, newArchive]);
    setIsAdding(false);
    setNewArchiveName('');
  };

  const handleSaveArchive = (id: string, field: 'name' | 'tags') => {
    setArchives(prev => prev.map(a => {
      if (a.id === id) {
        if (field === 'tags') {
          return { ...a, tags: editValue.split(',').map(t => t.trim()).filter(Boolean) };
        }
        return { ...a, [field]: editValue };
      }
      return a;
    }));
    setEditingArchiveId(null);
    setEditingField(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container">
      <div className="flex items-center gap-4 p-4 px-6 border-b border-outline-variant/10 shrink-0 h-16 bg-surface-container/50 backdrop-blur-md">
        <h2 className="text-xl font-headline font-extrabold text-on-surface">Archives</h2>
        <div className="ml-auto">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            onClick={() => setIsAdding(true)}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Archive
          </button>
        </div>
      </div>
      
      {isAdding && (
        <div className="p-6 border-b border-outline-variant/10 bg-surface-container-high animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex gap-4 mb-4">
            <input 
              autoFocus
              className="flex-1 bg-surface-variant/30 border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-all font-medium"
              placeholder="Archive Name (e.g. Q1 2024 Retrospective)"
              value={newArchiveName}
              onChange={e => setNewArchiveName(e.target.value)}
            />
            <select 
              className="bg-surface-variant/30 border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-all font-bold uppercase tracking-widest"
              value={newArchiveQuarter}
              onChange={e => setNewArchiveQuarter(e.target.value as any)}
            >
              {quarters.map(q => <option key={q} value={q} className="bg-surface-container-high">{q.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button 
              onClick={() => setIsAdding(false)} 
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddArchive} 
              className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {quarters.map(q => {
          const quarterArchives = archives.filter(a => a.quarter === q).sort((a, b) => a.name.localeCompare(b.name));
          
          return (
            <div key={q} className="mb-10">
              <h3 className="text-[10px] font-bold text-on-surface-variant/20 mb-6 uppercase tracking-[0.2em] flex items-center gap-4">
                {q.toUpperCase()}
                <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quarterArchives.map(a => (
                  <div 
                    key={a.id} 
                    className={`bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 transition-all cursor-pointer hover:border-primary/30 shadow-xl shadow-black/10 ${expandedArchiveId === a.id ? 'row-span-2 col-span-full md:col-span-2 lg:col-span-3 ring-2 ring-primary/30' : ''}`}
                    onClick={() => {
                      if (!editingArchiveId) setExpandedArchiveId(expandedArchiveId === a.id ? null : a.id);
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      {editingArchiveId === a.id && editingField === 'name' ? (
                        <input
                          autoFocus
                          className="text-xl font-headline font-extrabold bg-transparent border-none outline-none text-on-surface w-full border-b-2 border-primary"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveArchive(a.id, 'name')}
                          onKeyDown={e => e.key === 'Enter' && handleSaveArchive(a.id, 'name')}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          className="text-xl font-headline font-extrabold text-on-surface group-hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingArchiveId(a.id);
                            setEditingField('name');
                            setEditValue(a.name);
                          }}
                        >
                          {a.name}
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-3 py-1 rounded-full uppercase tracking-widest">
                        {a.tasks} tasks
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {editingArchiveId === a.id && editingField === 'tags' ? (
                        <input
                          autoFocus
                          className="text-[10px] font-bold uppercase tracking-widest text-on-surface bg-transparent border-none outline-none w-full border-b border-primary"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveArchive(a.id, 'tags')}
                          onKeyDown={e => e.key === 'Enter' && handleSaveArchive(a.id, 'tags')}
                          onClick={e => e.stopPropagation()}
                          placeholder="Comma separated tags..."
                        />
                      ) : (
                        <>
                          {a.tags.map((t, index) => (
                            <span key={`${t}-${index}`} className="px-3 py-1 rounded-full bg-surface-variant text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">#{t}</span>
                          ))}
                          <span 
                            className="text-[10px] px-3 py-1 rounded-full border border-dashed border-outline-variant/30 text-on-surface-variant/20 cursor-pointer hover:text-on-surface hover:border-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingArchiveId(a.id);
                              setEditingField('tags');
                              setEditValue(a.tags.join(', '));
                            }}
                          >
                            + Tag
                          </span>
                        </>
                      )}
                    </div>
                    
                    {expandedArchiveId === a.id && (
                      <div className="mt-6 pt-6 border-t border-outline-variant/10 animate-in fade-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">Archived Items</h4>
                          <span className="text-[10px] font-bold text-success uppercase tracking-widest">{a.completed} completed</span>
                        </div>
                        
                        {a.items && a.items.length > 0 ? (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {a.items.map(item => (
                              <div key={item.id} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-variant/10 border border-outline-variant/10 group">
                                <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-on-surface-variant/40 line-through truncate">{item.title}</div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">{item.project || 'No Project'}</span>
                                    {item.completedDate && (
                                      <span className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">• {new Date(item.completedDate).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-on-surface-variant/20 italic py-6 text-center">No items in this archive.</div>
                        )}
                      </div>
                    )}
                    
                    {expandedArchiveId !== a.id && (
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/20 mt-4 group-hover:text-primary transition-colors">
                        <span>View details</span>
                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                      </div>
                    )}
                  </div>
                ))}
                {quarterArchives.length === 0 && (
                  <div className="col-span-full py-10 border-2 border-dashed border-outline-variant/10 rounded-[32px] flex flex-col items-center justify-center opacity-20">
                    <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FolderView = () => {
  const { tasks, setTasks, activeFolder, setActiveFolder, folders, setFolders, activeProject, setActiveProject } = useAppContext();
  
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [editedFolderName, setEditedFolderName] = useState('');
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [editedProjectName, setEditedProjectName] = useState('');

  const folder = folders.find(f => f.name === activeFolder);
  const folderProjects = folder ? folder.projects : [];
  
  const folderTasks = tasks.filter(t => 
    !t.deleted && 
    !t.isInbox && 
    t.project && 
    folderProjects.includes(t.project)
  ).sort((a, b) => a.title.localeCompare(b.title));

  const handleRenameFolder = () => {
    if (editedFolderName.trim() && editedFolderName.trim() !== activeFolder && folder) {
      const newName = editedFolderName.trim();
      setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name: newName } : f));
      setActiveFolder(newName);
    }
    setIsEditingFolder(false);
  };

  const handleRenameProject = (oldName: string, index: number, newName: string) => {
    const trimmedNewName = newName.trim();
    if (trimmedNewName && trimmedNewName !== oldName) {
      const projectExists = folders.some(f => f.projects.includes(trimmedNewName));
      if (!projectExists) {
        setFolders(prev => prev.map(f => {
          if (f.id === folder?.id) {
            const newProjects = [...f.projects];
            newProjects[index] = trimmedNewName;
            return { ...f, projects: newProjects };
          }
          return f;
        }));
        setTasks(prev => prev.map(t => t.project === oldName ? { ...t, project: trimmedNewName } : t));
        if (activeProject === oldName) {
          setActiveProject(trimmedNewName);
        }
      } else {
        // Optionally, you could show an error message here
        // alert("A project with this name already exists.");
      }
    }
    setEditingProjectIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container">
      <div className="flex items-center gap-4 p-4 px-6 border-b border-outline-variant/10 shrink-0 h-16 bg-surface-container/50 backdrop-blur-md">
        {isEditingFolder ? (
          <input
            autoFocus
            type="text"
            value={editedFolderName}
            onChange={(e) => setEditedFolderName(e.target.value)}
            onBlur={handleRenameFolder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameFolder();
              if (e.key === 'Escape') setIsEditingFolder(false);
            }}
            className="text-xl font-headline font-extrabold bg-transparent border-none outline-none text-on-surface w-full"
          />
        ) : (
          <>
            <h2 
              className="text-xl font-headline font-extrabold text-on-surface cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                setEditedFolderName(activeFolder || '');
                setIsEditingFolder(true);
              }}
            >
              {activeFolder}
            </h2>
            <button
              onClick={() => {
                setEditedFolderName(activeFolder || '');
                setIsEditingFolder(true);
              }}
              className="opacity-0 group-hover/folder-title:opacity-100 text-on-surface-variant/40 hover:text-on-surface transition-opacity ml-2"
              title="Rename folder"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </>
        )}
        <span className="text-[10px] font-bold text-on-surface-variant/20 bg-surface-variant px-3 py-1 rounded-full uppercase tracking-widest ml-auto">
          {folderTasks.length} tasks
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mb-10">
          <h3 className="text-[10px] font-bold text-on-surface-variant/20 mb-6 uppercase tracking-[0.2em] flex items-center gap-4">
            PROJECTS
            <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folderProjects.length === 0 ? (
              <div className="col-span-full py-20 border-2 border-dashed border-outline-variant/10 rounded-[32px] flex flex-col items-center justify-center opacity-20">
                <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">No projects in this folder</span>
              </div>
            ) : (
              folderProjects.map((project, index) => {
                const projectTasks = folderTasks.filter(t => t.project === project);
                
                return (
                  <div 
                    key={`${project}-${index}`}
                    className={`bg-surface-container-high border border-outline-variant/30 rounded-[32px] p-6 transition-all cursor-pointer hover:border-primary/30 shadow-xl shadow-black/10 group ${activeProject === project ? 'ring-2 ring-primary/30' : ''}`}
                    onClick={() => setActiveProject(project)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      {editingProjectIndex === index ? (
                        <input
                          autoFocus
                          className="text-lg font-headline font-extrabold bg-transparent border-none outline-none text-on-surface w-full border-b-2 border-primary"
                          value={editedProjectName}
                          onChange={e => setEditedProjectName(e.target.value)}
                          onBlur={() => handleRenameProject(project, index, editedProjectName)}
                          onKeyDown={e => e.key === 'Enter' && handleRenameProject(project, index, editedProjectName)}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          className="text-lg font-headline font-extrabold text-on-surface group-hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectIndex(index);
                            setEditedProjectName(project);
                          }}
                        >
                          {project}
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-3 py-1 rounded-full uppercase tracking-widest">
                        {projectTasks.length} tasks
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/20 mt-4 group-hover:text-primary transition-colors">
                      <span>Open project</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant/20 mb-6 uppercase tracking-[0.2em] flex items-center gap-4">
            FOLDER TASKS
            <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
          </h3>
          <div className="space-y-3">
            {folderTasks.length > 0 ? (
              folderTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-high border border-outline-variant/10 hover:border-primary/30 transition-all group cursor-pointer"
                  onClick={() => setActiveProject(task.project || '')}
                >
                  <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-success' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium text-on-surface truncate ${task.completed ? 'line-through opacity-40' : ''}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{task.project}</span>
                      {task.dueDate && (
                        <span className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">• {task.dueDate}</span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
              ))
            ) : (
              <div className="py-20 border-2 border-dashed border-outline-variant/10 rounded-[32px] flex flex-col items-center justify-center opacity-20">
                <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">No tasks in this folder</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TagsView = () => {
  const { tasks, setTasks, tags, setTags } = useAppContext();
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#cdbdff');

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor
    };
    
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetTag: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          if (!t.tags.includes(targetTag)) {
            return { ...t, tags: [...t.tags, targetTag] };
          }
        }
        return t;
      }));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {tags.map(tag => {
          const tagTasks = tasks
            .filter(t => !t.deleted && !t.completed && t.tags.includes(tag.name))
            .sort((a, b) => a.title.localeCompare(b.title));

          return (
            <div 
              key={tag.id} 
              className="bg-surface-container-high rounded-[32px] border border-outline-variant/30 flex flex-col max-h-[500px] shadow-xl shadow-black/10 transition-all hover:border-primary/30 group"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => handleDrop(e, tag.name)}
            >
              <div 
                className="p-5 border-b border-outline-variant/10 flex items-center justify-between shrink-0 rounded-t-[32px] bg-surface-variant/10" 
                style={{ borderTop: `4px solid ${tag.color}` }}
              >
                <div className="font-headline font-extrabold text-sm flex items-center gap-3" style={{ color: tag.color }}>
                  <span className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-4 ring-offset-surface-container-high" style={{ backgroundColor: tag.color }}></span>
                  {tag.name}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-3 py-1 rounded-full uppercase tracking-widest">
                  {tagTasks.length}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[120px] space-y-1">
                {tagTasks.length > 0 ? (
                  tagTasks.map(t => (
                    <TaskItem key={t.id} task={t} />
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 opacity-20">
                    <span className="material-symbols-outlined text-3xl mb-2">drag_indicator</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Drag tasks here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Tag Card */}
        <div 
          className="bg-surface-container-high rounded-[32px] border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center p-8 min-h-[200px] hover:bg-surface-variant/20 hover:border-primary/50 transition-all cursor-pointer group shadow-xl shadow-black/5" 
          onClick={() => setIsAddingTag(true)}
        >
          {!isAddingTag ? (
            <>
              <div className="w-14 h-14 rounded-[20px] bg-surface-variant flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 group-hover:text-on-surface transition-colors">Add New Tag</span>
            </>
          ) : (
            <div className="w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <input 
                autoFocus
                className="w-full bg-surface-variant/30 border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-all font-medium mb-4"
                placeholder="Tag Name"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') setIsAddingTag(false);
                }}
              />
              <div className="flex items-center justify-between">
                <div className="relative group/color">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-outline-variant/30 cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: newTagColor, boxShadow: `0 0 15px ${newTagColor}40` }}
                  ></div>
                  <div className="absolute top-full left-0 mt-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-surface-container-high border border-outline-variant/30 rounded-3xl p-4 shadow-2xl shadow-black/40">
                      <HexColorPicker color={newTagColor} onChange={setNewTagColor} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsAddingTag(false)}
                    className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface px-3 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateTag}
                    className="bg-primary text-on-primary px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TrashView = () => {
  const { tasks, setTasks, folders, setFolders } = useAppContext();
  
  const deletedTasks = tasks.filter(t => t.deleted);
  const deletedFolders = folders.filter(f => f.deleted);

  const restoreTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, deleted: false } : t));
  };

  const permanentDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const restoreFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, deleted: false } : f));
  };

  const permanentDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const emptyTrash = () => {
    setTasks(prev => prev.filter(t => !t.deleted));
    setFolders(prev => prev.filter(f => !f.deleted));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-container max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface">Trash</h2>
        {(deletedTasks.length > 0 || deletedFolders.length > 0) && (
          <button 
            onClick={emptyTrash}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest hover:bg-error hover:text-on-error transition-all shadow-lg shadow-error/10"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            Empty Trash
          </button>
        )}
      </div>

      {deletedFolders.length > 0 && (
        <div className="mb-12">
          <h3 className="text-[10px] font-bold text-on-surface-variant/20 mb-6 uppercase tracking-[0.2em] flex items-center gap-4">
            Deleted Folders
            <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
          </h3>
          <div className="space-y-3">
            {deletedFolders.map(f => (
              <div key={f.id} className="flex items-center justify-between p-5 rounded-[24px] border border-outline-variant/30 bg-surface-container-high shadow-xl shadow-black/5 group">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full ring-2 ring-offset-4 ring-offset-surface-container-high" style={{ backgroundColor: f.color }}></div>
                  <span className="text-base font-headline font-extrabold text-on-surface">{f.name}</span>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => restoreFolder(f.id)} 
                    className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-variant transition-all"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => permanentDeleteFolder(f.id)} 
                    className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-error/60 hover:text-on-error hover:bg-error transition-all"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deletedTasks.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant/20 mb-6 uppercase tracking-[0.2em] flex items-center gap-4">
            Deleted Tasks
            <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
          </h3>
          <div className="space-y-2">
            {deletedTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-[20px] border border-outline-variant/30 bg-surface-container-high shadow-xl shadow-black/5 group">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant/20">delete</span>
                  <span className="text-sm font-medium text-on-surface-variant/40 line-through">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => restoreTask(t.id)} 
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-variant transition-all"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => permanentDeleteTask(t.id)} 
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-error/60 hover:text-on-error hover:bg-error transition-all"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deletedTasks.length === 0 && deletedFolders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-black/10">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">delete_outline</span>
          </div>
          <h3 className="text-xl font-headline font-extrabold text-on-surface mb-2">Trash is empty</h3>
          <p className="text-sm font-medium text-on-surface-variant/40">Items you delete will appear here for 30 days.</p>
        </div>
      )}
    </div>
  );
};

export const UpcomingView = () => {
  const { tasks, setTasks, tags: globalTags, setTags: setGlobalTags } = useAppContext();
  
  const upcomingTasks = tasks.filter(t => t.dueDate && t.dueDate > getLocalDateString() && !t.completed && !t.deleted);
  
  const tasksByDate = upcomingTasks.reduce((acc, task) => {
    const date = task.dueDate!;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const sortedDates = Object.keys(tasksByDate).sort();

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>, date: string) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const input = e.currentTarget.value.trim();
      const { title, tags } = parseTaskInput(input);

      tags.forEach(tagName => {
        if (!globalTags.find(t => t.name === tagName)) {
          const newTag = {
            id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: tagName,
            color: '#cdbdff'
          };
          setGlobalTags(prev => [...prev, newTag]);
        }
      });

      setTasks(prev => [{
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        priority: 'p4',
        tags,
        completed: false,
        isInbox: false,
        dueDate: date
      }, ...prev]);
      e.currentTarget.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
      <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-10">Upcoming</h2>

      {sortedDates.length > 0 ? (
        sortedDates.map(date => (
          <div key={date} className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">{formatDate(date)}</h3>
              <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
              <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-variant px-2 py-0.5 rounded-full">{tasksByDate[date].length}</span>
            </div>
            
            <div className="space-y-1 mb-4">
              {tasksByDate[date].sort((a, b) => a.title.localeCompare(b.title)).map(t => (
                <TaskItem key={t.id} task={t} />
              ))}
            </div>

            <div className="bg-surface-container-high/50 border border-outline-variant/20 rounded-2xl p-3 flex items-center gap-3 shadow-sm focus-within:border-primary/30 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-xl">add</span>
              <input 
                type="text" 
                placeholder={`Add task for ${formatDate(date)}...`} 
                className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm font-medium placeholder:text-on-surface-variant/20"
                onKeyDown={(e) => handleAddTask(e, date)}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-black/10">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">calendar_month</span>
          </div>
          <h3 className="text-xl font-headline font-extrabold text-on-surface mb-2">No upcoming tasks</h3>
          <p className="text-sm font-medium text-on-surface-variant/40">Your schedule looks clear for the next few days.</p>
        </div>
      )}
    </div>
  );
};

export const CalendarView = () => {
  const { tasks, setIsAddTaskOpen, setTasks } = useAppContext();
  const [viewMode, setViewMode] = React.useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonthDays = getDaysInMonth(year, month - 1);

  let displayDays: { day: number, isCurrentMonth: boolean, date: Date }[] = [];
  
  if (viewMode === 'month') {
    for (let i = firstDay - 1; i >= 0; i--) {
      displayDays.push({ 
        day: prevMonthDays - i, 
        isCurrentMonth: false, 
        date: new Date(year, month - 1, prevMonthDays - i) 
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      displayDays.push({ 
        day: i, 
        isCurrentMonth: true, 
        date: new Date(year, month, i) 
      });
    }
    const remainingDays = 42 - displayDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      displayDays.push({ 
        day: i, 
        isCurrentMonth: false, 
        date: new Date(year, month + 1, i) 
      });
    }
  } else {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      displayDays.push({
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        date: d
      });
    }
  }

  const selectedDateStr = getLocalDateString(selectedDate);
  const selectedDayTasks = tasks.filter(t => t.dueDate === selectedDateStr && !t.deleted);
  const sortedSelectedDayTasks = [...selectedDayTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
    return 0;
  });

  const remainingTasksThisMonth = tasks.filter(t => {
    if (t.deleted || t.completed || !t.dueDate) return false;
    const taskDate = new Date(t.dueDate);
    return taskDate.getMonth() === month && taskDate.getFullYear() === year;
  }).length;

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toISOString() : undefined } : t));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container">
      <div className="flex items-center justify-between px-8 py-6 shrink-0">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-1">
            {monthNames[month]} {year}
          </h2>
          <p className="text-sm font-medium text-on-surface-variant/40">
            {remainingTasksThisMonth} tasks remaining this month
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl p-1 flex gap-1">
            <button 
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant/40 hover:text-on-surface'}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button 
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant/40 hover:text-on-surface'}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-outline-variant/40 transition-all"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'month') newDate.setMonth(month - 1);
                else newDate.setDate(currentDate.getDate() - 7);
                setCurrentDate(newDate);
              }}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              className="px-4 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:border-outline-variant/40 transition-all"
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }}
            >
              Today
            </button>
            <button 
              className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-outline-variant/40 transition-all"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'month') newDate.setMonth(month + 1);
                else newDate.setDate(currentDate.getDate() + 7);
                setCurrentDate(newDate);
              }}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-8">
        <div className="flex-1 flex flex-col bg-surface-container-high border border-outline-variant/30 rounded-[40px] overflow-hidden shadow-2xl shadow-black/20">
          <div className="grid grid-cols-7 border-b border-outline-variant/10">
            {dayNames.map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
                {day}
              </div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {displayDays.map((d, i) => {
              const isToday = getLocalDateString(d.date) === getLocalDateString(new Date());
              const isSelected = getLocalDateString(d.date) === getLocalDateString(selectedDate);
              const dayTasks = tasks.filter(t => t.dueDate === getLocalDateString(d.date) && !t.deleted);
              const hasIncomplete = dayTasks.some(t => !t.completed);
              
              return (
                <div 
                  key={i} 
                  className={`relative border-r border-b border-outline-variant/5 p-3 cursor-pointer transition-all hover:bg-on-surface/[0.02] flex flex-col ${!d.isCurrentMonth ? 'opacity-20' : ''} ${isSelected ? 'bg-primary/[0.03]' : ''}`}
                  onClick={() => setSelectedDate(d.date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full transition-all ${isToday ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : isSelected ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}>
                      {d.day}
                    </span>
                    {hasIncomplete && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden space-y-1">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className={`text-[10px] px-2 py-1 rounded-md truncate font-medium ${t.completed ? 'bg-on-surface-variant/5 text-on-surface-variant/40 line-through' : 'bg-surface-variant text-on-surface-variant'}`}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] font-bold text-on-surface-variant/40 px-2">
                        + {dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-96 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-headline font-extrabold text-on-surface">
              {fullDayNames[selectedDate.getDay()]}
            </h3>
            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {sortedSelectedDayTasks.length > 0 ? (
              sortedSelectedDayTasks.map(task => (
                <div key={task.id} className="group flex items-center gap-4 bg-surface-container-high border border-outline-variant/20 p-4 rounded-2xl hover:border-outline-variant/40 transition-all">
                  <button 
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${task.completed ? 'bg-primary border-primary' : 'border-outline-variant/40 hover:border-primary'}`}
                  >
                    {task.completed && <span className="material-symbols-outlined text-on-primary text-sm font-bold">check</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${task.completed ? 'text-on-surface-variant/40 line-through' : 'text-on-surface'}`}>
                      {task.title}
                    </div>
                    {task.dueTime && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {task.dueTime}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <span className="material-symbols-outlined text-4xl mb-2">event_available</span>
                <p className="text-xs font-bold uppercase tracking-widest">No tasks scheduled</p>
              </div>
            )}
          </div>
          
          <button 
            className="mt-6 w-full py-4 rounded-2xl bg-primary text-on-primary text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            onClick={() => setIsAddTaskOpen(true)}
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export const HistoryView = () => {
  const { tasks, archives } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Combine active tasks and archived tasks for history
  const allTasks = [...tasks, ...archives.flatMap(a => a.items || [])];
  
  // Calculate Stats
  const completedTasks = allTasks.filter(t => t.completed && t.completedDate);
  
  // 1. Streak Calculation
  const getStreak = () => {
    if (completedTasks.length === 0) return 0;
    
    // Get unique dates with completed tasks
    const dates: string[] = Array.from(new Set(completedTasks.map(t => t.completedDate!.split('T')[0]))).sort() as string[];
    
    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if streak is active (completed today or yesterday)
    const lastCompleted = dates[dates.length - 1];
    if (lastCompleted !== today && lastCompleted !== yesterday) return 0;

    let streak = 1;
    let current = new Date(lastCompleted);
    
    for (let i = dates.length - 2; i >= 0; i--) {
      const prev = new Date(dates[i]);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        streak++;
        current = prev;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = getStreak();
  const totalDays = new Set(completedTasks.map(t => t.completedDate!.split('T')[0])).size;

  // 2. Overview & Goals (Monthly)
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Filter tasks relevant to the selected month
  const monthTasks = allTasks.filter(t => {
    // Task is due in this month
    if (t.dueDate && t.dueDate.startsWith(currentMonthStr)) return true;
    // Task was completed in this month (even if due earlier/later)
    if (t.completed && t.completedDate && t.completedDate.startsWith(currentMonthStr)) return true;
    return false;
  });

  // Completed: Completed in this month
  const monthCompleted = monthTasks.filter(t => t.completed && t.completedDate && t.completedDate.startsWith(currentMonthStr)).length;
  
  // Failed: Due in this month AND (not completed OR completed AFTER this month)
  // Also count overdue tasks if viewing the current month
  const monthFailed = monthTasks.filter(t => {
    if (!t.dueDate || !t.dueDate.startsWith(currentMonthStr)) return false; // Not due this month
    
    if (!t.completed) {
      // If viewing past month, any uncompleted task due in that month is failed
      if (currentMonthStr < todayStr.slice(0, 7)) return true;
      // If viewing current month, task is failed if due date < today
      if (currentMonthStr === todayStr.slice(0, 7) && t.dueDate < todayStr) return true;
      return false; 
    } else {
      // Completed, but was it completed late (after this month)?
      // If completed in a later month, it counts as failed for THIS month's goals
      return t.completedDate! > t.dueDate && !t.completedDate!.startsWith(currentMonthStr);
    }
  }).length;

  // Total relevant tasks for the month (Completed + Failed + Pending/InProgress)
  // InProgress: Due in this month, not completed, but NOT yet overdue (future due date in this month)
  const monthInProgress = monthTasks.filter(t => {
    if (!t.dueDate || !t.dueDate.startsWith(currentMonthStr)) return false;
    if (t.completed) return false; // Already handled in completed (or failed if late)
    // It is pending. Is it overdue?
    if (currentMonthStr < todayStr.slice(0, 7)) return false; // Past month pending = failed
    if (currentMonthStr === todayStr.slice(0, 7) && t.dueDate < todayStr) return false; // Current month overdue = failed
    return true; // Future due date in this month
  }).length;

  // Total for consistency calculation: Completed + Failed + InProgress
  // Note: monthTasks might include tasks completed this month but due in previous months. 
  // Those count towards "Completed" but maybe not "Total" for consistency if we strictly want "Tasks DUE this month"?
  // Usually "Consistency" is (Completed / (Completed + Failed)). InProgress doesn't count against you yet.
  
  const consistencyBase = monthCompleted + monthFailed;
  const consistency = consistencyBase > 0 ? Math.round((monthCompleted / consistencyBase) * 100) : 0;

  const overview = { 
    good: monthCompleted, 
    bad: monthFailed, 
    consistency: consistency
  };
  
  const goals = { 
    completed: monthCompleted, 
    inProgress: monthInProgress, 
    failed: monthFailed 
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  // Adjust for Monday start
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-bg p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-bg2 rounded-full text-text-muted"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-serif font-medium">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-bg2 rounded-full text-text-muted"><ChevronRight size={20} /></button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-text-faint font-mono mb-2">{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            const isFuture = new Date(dateStr) > new Date();
            
            // Check status for this day
            const dayTasks = allTasks.filter(t => (t.dueDate === dateStr) || (t.completed && t.completedDate?.startsWith(dateStr)));
            const dayCompleted = dayTasks.filter(t => t.completed).length;
            const dayTotal = dayTasks.length;
            
            let status = null;
            if (!isFuture && dayTotal > 0) {
              if (dayCompleted === dayTotal) status = 'completed';
              else if (dayCompleted > 0) status = 'partial'; // Or handle as missed if strictly all needed
              else status = 'missed';
            }
            
            return (
              <div key={day} className={`aspect-square flex items-center justify-center relative rounded-full ${isToday ? 'bg-bg3 text-text-main' : 'text-text-muted'} ${isFuture ? 'opacity-30' : ''}`}>
                <span className="text-sm font-medium z-10">{day}</span>
                {status === 'completed' && (
                  <div className="absolute inset-0 border-2 border-green rounded-full opacity-50"></div>
                )}
                {status === 'missed' && (
                  <div className="absolute bottom-1 w-1 h-1 bg-red rounded-full"></div>
                )}
                 {status === 'partial' && (
                  <div className="absolute inset-0 border-2 border-orange rounded-full opacity-50"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Streak Card */}
        <div className="bg-bg2 rounded-2xl p-6 mb-4 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="text-orange fill-orange" size={24} />
              <span className="text-3xl font-serif font-bold text-text-main">Streak: {streak}</span>
            </div>
            <div className="text-text-faint text-sm">Total days: {totalDays}</div>
          </div>
          <div className="relative z-10">
             <div className="px-3 py-1 rounded-full bg-bg3 border border-border-strong text-[10px] text-text-muted uppercase tracking-wider">
               Freeze streak
             </div>
          </div>
          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-20">
          <div className="bg-bg2 rounded-2xl p-5">
            <div className="text-text-faint text-xs font-mono uppercase tracking-wider mb-4">Overview</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Good</span>
                <span className="text-sm font-medium text-green">{overview.good}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Bad</span>
                <span className="text-sm font-medium text-red">{overview.bad}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <div className="text-2xl font-serif font-bold">{overview.consistency}%</div>
                <div className="text-[10px] text-text-faint">Consistency</div>
              </div>
            </div>
          </div>

          <div className="bg-bg2 rounded-2xl p-5">
            <div className="text-text-faint text-xs font-mono uppercase tracking-wider mb-4">Goals</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Completed</span>
                <span className="text-sm font-medium text-text-main">{goals.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">In Progress</span>
                <span className="text-sm font-medium text-accent">{goals.inProgress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Failed</span>
                <span className="text-sm font-medium text-red">{goals.failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
