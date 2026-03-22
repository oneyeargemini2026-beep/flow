import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Brain, Flame } from 'lucide-react';
import { useAppContext } from '../store';
import { TaskItem } from './TaskItem';
import { getLocalDateString, parseTaskInput } from '../utils';
import { HexColorPicker } from 'react-colorful';
import { Archive, MatrixQuadrant } from '../types';

const CircularProgress = ({ completed, total }: { completed: number; total: number }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const dashoffset = circumference * (1 - progress);
  
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-bg4"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={progress === 1 ? "#22c55e" : "var(--color-accent)"}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono text-text-main">{completed}/{total}</span>
        </div>
      </div>
      <div className="text-xs text-text-faint mt-2 font-mono uppercase tracking-wider">Daily Progress</div>
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
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-medium text-text-main">Goals</h2>
        <button 
          className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none"
          onClick={() => setIsAdding(true)}
        >
          + New Goal
        </button>
      </div>

      {isAdding && (
        <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: newGoalColor }}></div>
            <input 
              autoFocus
              type="text" 
              placeholder="Goal name (e.g. Be satisfied with Calisthenics abilities)" 
              className="flex-1 bg-transparent border-none outline-none text-text-main text-sm font-sans placeholder:text-text-faint"
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="text-xs text-text-muted hover:text-text-main">Cancel</button>
            <button onClick={handleAddGoal} className="text-xs text-accent hover:text-accent2 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => {
          // Check if any task linked to this goal was completed today
          const completedToday = tasks.some(t => 
            t.goalId === goal.id && 
            t.completed && 
            t.completedDate && 
            t.completedDate.startsWith(todayStr)
          );

          const linkedTasks = tasks.filter(t => t.goalId === goal.id && !t.deleted);
          const pendingTasks = linkedTasks.filter(t => !t.completed);

          return (
            <div key={goal.id} className="bg-bg2 border border-border-subtle rounded-[10px] p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }}></div>
                  {editingGoalId === goal.id ? (
                    <input 
                      autoFocus
                      className="font-serif text-lg bg-transparent border-b border-accent outline-none text-text-main"
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
                      className="font-serif text-lg text-text-main cursor-pointer hover:text-accent transition-colors"
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
                  className="text-text-faint hover:text-red-500 transition-colors"
                  onClick={() => handleDeleteGoal(goal.id)}
                  title="Delete Goal"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${completedToday ? 'bg-green/10 text-green' : 'bg-bg3 text-text-muted'}`}>
                  {completedToday ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Progress made today
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      No progress today
                    </>
                  )}
                </div>
                <div className="text-xs text-text-faint font-mono">
                  {pendingTasks.length} pending tasks
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border-subtle">
                <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Linked Tasks</div>
                {pendingTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="text-sm text-text-main truncate mb-1 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-border-strong"></div>
                    {t.title}
                  </div>
                ))}
                {pendingTasks.length > 3 && (
                  <div className="text-xs text-text-faint italic mt-1">+{pendingTasks.length - 3} more...</div>
                )}
                {pendingTasks.length === 0 && (
                  <div className="text-xs text-text-faint italic">No pending tasks linked.</div>
                )}
              </div>
            </div>
          );
        })}
        {goals.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-10 text-text-faint italic">
            No goals set yet. Create one to start tracking your progress!
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
      } else {
        // Optionally, you could show an error message here
        // alert("A project with this name already exists.");
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

      // Add new tags to global tags
      tags.forEach(tagName => {
        if (!globalTags.find(t => t.name === tagName)) {
          const newTag = {
            id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: tagName,
            color: '#7c6af7'
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
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <div className="flex items-center gap-2.5 mb-6 group/project-title">
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
            className="text-xl font-serif font-medium bg-transparent border-none outline-none text-text-main w-full"
          />
        ) : (
          <>
            <h2 
              className="text-xl font-serif font-medium text-text-main cursor-pointer hover:underline decoration-dotted underline-offset-4"
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
              className="opacity-0 group-hover/project-title:opacity-100 text-text-faint hover:text-text-main transition-opacity"
              title="Rename project"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
          </>
        )}
        <span className="text-xs text-text-faint bg-bg3 px-2 py-0.5 rounded-full font-mono ml-2 shrink-0">
          {incompleteTasks.length} tasks
        </span>
      </div>

      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-3 px-4 flex items-center gap-3 mb-5 cursor-text">
        <div className="text-text-faint w-4 h-4 flex items-center justify-center font-mono text-lg">+</div>
        <input 
          type="text" 
          placeholder={`Add task to ${activeProject}...`} 
          className="flex-1 bg-transparent border-none outline-none text-text-main text-sm font-sans placeholder:text-text-faint"
          onKeyDown={handleAddTask}
        />
      </div>
      
      {/* Group tasks by section */}
      {(() => {
        const sections = Array.from(new Set(incompleteTasks.map(t => t.section || '')));
        // Sort sections: empty string (no section) first, then alphabetical
        sections.sort((a, b) => {
            if (!a) return -1;
            if (!b) return 1;
            return a.localeCompare(b);
        });

        return sections.map(section => {
          const sectionTasks = incompleteTasks.filter(t => (t.section || '') === section);
          if (sectionTasks.length === 0 && !section) return null; // Skip empty default section if no tasks

          return (
            <div 
              key={section || 'unsectioned'} 
              className="mb-4"
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
              {section && (
                <div className="font-serif text-sm text-text-muted mb-2 mt-4 border-b border-border-subtle pb-1">{section}</div>
              )}
              {sectionTasks.map(t => <TaskItem key={t.id} task={t} />)}
            </div>
          );
        });
      })()}

      <div className="mt-4 flex items-center gap-2">
        <input 
          type="text" 
          placeholder="+ Add section..." 
          className="bg-transparent border-none outline-none text-xs text-text-faint hover:text-text-muted transition-colors"
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
        <>
          <div className="flex items-center gap-2.5 mb-2 mt-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">
              Completed
            </div>
            <div className="flex-1 h-[1px] bg-border-subtle"></div>
            <div className="font-mono text-[10px] text-text-faint">{completedTasks.length}</div>
          </div>
          {completedTasks.map(t => <TaskItem key={t.id} task={t} />)}
        </>
      )}
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
            color: '#7c6af7'
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
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <CircularProgress completed={completedCount} total={totalTasks} />
      
      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-3 px-4 flex items-center gap-3 mb-5 cursor-text">
        <Brain className="text-text-faint w-4 h-4" />
        <input 
          type="text" 
          placeholder="Brain dump anything here… press Enter to capture" 
          className="flex-1 bg-transparent border-none outline-none text-text-main text-sm font-sans placeholder:text-text-faint"
          onKeyDown={handleBrainDump}
        />
        <span className="font-mono text-[10px] text-text-faint bg-bg3 px-2 py-0.5 rounded">INBOX</span>
      </div>

      {overdue.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 mb-2 mt-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">Overdue</div>
            <div className="flex-1 h-[1px] bg-border-subtle"></div>
            <div className="font-mono text-[10px] text-text-faint">{overdue.length}</div>
          </div>
          {overdue.map(t => <TaskItem key={t.id} task={t} />)}
        </>
      )}

      <div className="flex items-center gap-2.5 mb-2 mt-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">
          Today
        </div>
        <div className="flex-1 h-[1px] bg-border-subtle"></div>
        <div className="bg-accent/20 text-accent2 font-mono text-[10px] px-2 py-0.5 rounded">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
        <div className="font-mono text-[10px] text-text-faint">{today.length}</div>
      </div>
      
      {today.map(t => <TaskItem key={t.id} task={t} />)}

      {completed.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 mb-2 mt-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">
              Completed today
            </div>
            <div className="flex-1 h-[1px] bg-border-subtle"></div>
            <div className="font-mono text-[10px] text-text-faint">{completed.length}</div>
          </div>
          {completed.map(t => <TaskItem key={t.id} task={t} />)}
        </>
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
      <div className="flex items-center gap-6 px-3.5 md:px-6 border-b border-border-subtle shrink-0 h-12">
        <button 
          className={`h-full text-[13px] font-medium border-b-2 transition-colors ${activeTab === 'capture' ? 'border-accent text-text-main' : 'border-transparent text-text-muted hover:text-text-main'}`}
          onClick={() => setActiveTab('capture')}
        >
          Capture
        </button>
        <button 
          className={`h-full text-[13px] font-medium border-b-2 transition-colors ${activeTab === 'process' ? 'border-accent text-text-main' : 'border-transparent text-text-muted hover:text-text-main'}`}
          onClick={() => setActiveTab('process')}
        >
          Process ({inboxTasks.length})
        </button>
      </div>

      {activeTab === 'capture' ? (
        <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
          <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4 mb-4">
            <textarea 
              placeholder="Dump everything on your mind here. Don't filter, don't organize — just capture.&#10;&#10;Press Enter to add each item to Uncategorized…" 
              className="w-full bg-transparent border-none outline-none text-text-main text-sm font-sans resize-none min-h-[80px] placeholder:text-text-faint"
              onKeyDown={handleInboxCapture}
              id="inbox-capture-textarea"
            ></textarea>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-faint">{inboxTasks.length} unsorted items</span>
              <button 
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none"
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

          <div className="flex items-center gap-2.5 mb-2 mt-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">Uncategorized</div>
            <div className="flex-1 h-[1px] bg-border-subtle"></div>
            <div className="font-mono text-[10px] text-text-faint">{inboxTasks.length}</div>
          </div>
          {inboxTasks.map(t => <TaskItem key={t.id} task={t} />)}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6 flex flex-col items-center justify-center">
          {inboxTasks.length > 0 ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📥</div>
              <h3 className="text-lg font-medium text-text-main mb-2">Ready to process?</h3>
              <p className="text-sm text-text-muted mb-6 max-w-md">
                You have {inboxTasks.length} items in your inbox. Processing involves deciding if they are actionable, assigning projects, and setting dates.
              </p>
              <button 
                className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none"
                onClick={() => setIsProcessInboxOpen(true)}
              >
                Start Processing
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-medium text-text-main mb-2">Inbox Zero</h3>
              <p className="text-sm text-text-muted">
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
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 content-start">
      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint mb-3">Completed Today</div>
        <div className="font-serif text-4xl text-text-main leading-none">{completedToday.length}</div>
        <div className="text-xs text-text-faint mt-1">of {todayTasks.length} tasks</div>
        <div className="h-1.5 bg-bg3 rounded-full overflow-hidden mt-2 mb-0">
          <div className="h-full bg-green rounded-full transition-all" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint mb-3">Focus Time</div>
        <div className="font-serif text-4xl text-text-main leading-none">0h 0m</div>
        <div className="text-xs text-text-faint mt-1">0 pomodoro sessions</div>
        <div className="h-1.5 bg-bg3 rounded-full overflow-hidden mt-2 mb-0">
          <div className="h-full bg-accent rounded-full w-[0%]"></div>
        </div>
      </div>
      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint mb-3">Weekly Streak</div>
        <div className="font-serif text-4xl text-text-main leading-none">0</div>
        <div className="text-xs text-text-faint mt-1">days active</div>
        <div className="flex gap-[3px] mt-2.5 items-end h-10">
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
          <div className="w-2.5 h-[10px] bg-bg3 rounded-[2px]"></div>
        </div>
      </div>
      
      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4.5 col-span-1 md:col-span-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint mb-3">Priority Breakdown</div>
        <div className="flex gap-5">
          <div className="flex-1 text-center">
            <div className="font-serif text-2xl text-red">{p1}</div>
            <div className="text-[11px] text-text-faint">P1 Critical</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-serif text-2xl text-orange">{p2}</div>
            <div className="text-[11px] text-text-faint">P2 High</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-serif text-2xl text-accent">{p3}</div>
            <div className="text-[11px] text-text-faint">P3 Medium</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-serif text-2xl text-text-faint">{p4}</div>
            <div className="text-[11px] text-text-faint">P4 Low</div>
          </div>
        </div>
      </div>

      <div className="bg-bg2 border border-border-subtle rounded-[10px] p-4.5 col-span-1 md:col-span-2 lg:col-span-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint mb-3">Inbox</div>
        <div className="font-serif text-4xl text-orange leading-none">{inboxTasks.length}</div>
        <div className="text-xs text-text-faint mt-1">items need processing</div>
        <button 
          className="w-full mt-3 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors bg-transparent text-text-muted border border-border-strong hover:bg-bg3 hover:text-text-main flex justify-center"
          onClick={() => setIsProcessInboxOpen(true)}
        >
          Process now →
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 px-3.5 md:px-6 border-b border-border-subtle flex gap-2 items-center shrink-0">
        <span className="text-xs text-text-faint">Eisenhower Matrix — click titles or subtitles to edit · click color dot to recolor</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 gap-[1px] flex-1 overflow-y-auto md:overflow-hidden bg-border-subtle">
        {quadrants.map(q => (
          <div key={q.id} className="bg-bg p-5 overflow-y-auto flex flex-col gap-2 relative">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <div className="relative inline-block">
                  {editingQuadrant === q.id && editingField === 'title' ? (
                    <input
                      autoFocus
                      className="font-serif text-base bg-transparent border-none outline-none text-text-main w-full border-b border-accent"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleSave(q.id, 'title')}
                      onKeyDown={e => e.key === 'Enter' && handleSave(q.id, 'title')}
                    />
                  ) : (
                    <div 
                      className="font-serif text-base outline-none cursor-pointer border-b border-transparent hover:border-white/15 inline-block min-w-[20px]"
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
                <div className="mt-0.5">
                  {editingQuadrant === q.id && editingField === 'subtitle' ? (
                    <input
                      autoFocus
                      className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-faint bg-transparent border-none outline-none w-full border-b border-accent"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleSave(q.id, 'subtitle')}
                      onKeyDown={e => e.key === 'Enter' && handleSave(q.id, 'subtitle')}
                    />
                  ) : (
                    <div 
                      className="text-[11px] text-text-faint font-mono outline-none cursor-pointer block hover:text-text-muted"
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
                  className="w-[22px] h-[22px] rounded-full border-2 border-border-strong cursor-pointer shrink-0 mt-0.5 transition-transform hover:scale-110"
                  style={{ backgroundColor: q.color }}
                  onClick={() => setColorPickerOpen(colorPickerOpen === q.id ? null : q.id)}
                ></div>
                {colorPickerOpen === q.id && (
                  <div className="absolute top-8 right-0 z-50">
                    <div className="fixed inset-0" onClick={() => setColorPickerOpen(null)}></div>
                    <div className="relative bg-bg border border-border-strong rounded-lg p-2 shadow-xl">
                      <HexColorPicker color={q.color} onChange={(c) => handleColorChange(q.id, c)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {tasks.filter(t => !t.completed && !t.deleted && t.priority === q.priority).sort((a, b) => a.title.localeCompare(b.title)).map(t => (
              <TaskItem key={t.id} task={t} />
            ))}
            {tasks.filter(t => !t.completed && !t.deleted && t.priority === q.priority).length === 0 && (
              <div className="text-text-faint text-xs italic opacity-50">No tasks</div>
            )}
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 p-3 px-3.5 md:px-6 border-b border-border-subtle shrink-0 h-12">
        <span className="text-xs text-text-faint">Archives</span>
        <div className="ml-auto">
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg2 border border-border-strong text-text-muted text-xs cursor-pointer transition-colors hover:bg-bg3 hover:text-text-main"
            onClick={() => setIsAdding(true)}
          >
            + Add Archive
          </button>
        </div>
      </div>
      
      {isAdding && (
        <div className="p-4 border-b border-border-subtle bg-bg2">
          <div className="flex gap-2 mb-2">
            <input 
              autoFocus
              className="flex-1 bg-bg3 border border-border-strong rounded px-2 py-1 text-sm text-text-main outline-none focus:border-accent"
              placeholder="Archive Name"
              value={newArchiveName}
              onChange={e => setNewArchiveName(e.target.value)}
            />
            <select 
              className="bg-bg3 border border-border-strong rounded px-2 py-1 text-sm text-text-main outline-none"
              value={newArchiveQuarter}
              onChange={e => setNewArchiveQuarter(e.target.value as any)}
            >
              {quarters.map(q => <option key={q} value={q}>{q.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="text-xs text-text-muted hover:text-text-main">Cancel</button>
            <button onClick={handleAddArchive} className="text-xs text-accent hover:text-accent2 font-medium">Create</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {quarters.map(q => (
          <div key={q} className="mb-6">
            <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider border-b border-border-subtle pb-1">{q.toUpperCase()}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archives.filter(a => a.quarter === q).sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                <div 
                  key={a.id} 
                  className={`bg-bg2 border border-border-subtle rounded-[10px] p-4 transition-all cursor-pointer hover:border-accent/50 ${expandedArchiveId === a.id ? 'row-span-2 col-span-full md:col-span-2 lg:col-span-3 ring-1 ring-accent' : ''}`}
                  onClick={() => {
                    if (!editingArchiveId) setExpandedArchiveId(expandedArchiveId === a.id ? null : a.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    {editingArchiveId === a.id && editingField === 'name' ? (
                      <input
                        autoFocus
                        className="font-serif text-[18px] bg-transparent border-none outline-none text-text-main w-full border-b border-accent"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleSaveArchive(a.id, 'name')}
                        onKeyDown={e => e.key === 'Enter' && handleSaveArchive(a.id, 'name')}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div 
                        className="font-serif text-[18px] font-medium text-text-main hover:text-accent transition-colors"
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
                    <div className="text-xs font-mono text-text-faint bg-bg3 px-2 py-1 rounded-md">
                      {a.tasks} tasks
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {editingArchiveId === a.id && editingField === 'tags' ? (
                      <input
                        autoFocus
                        className="font-mono text-[10px] bg-transparent border-none outline-none text-text-main w-full border-b border-accent"
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
                          <span key={`${t}-${index}`} className="text-[10px] px-1.5 py-0.5 rounded border border-border-strong text-text-faint bg-bg3">{t}</span>
                        ))}
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-border-strong text-text-faint cursor-pointer hover:text-text-main hover:border-text-muted transition-colors"
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
                    <div className="mt-4 pt-4 border-t border-border-subtle animate-fadeIn" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Archived Items</h4>
                        <span className="text-[10px] text-text-faint">{a.completed} completed</span>
                      </div>
                      
                      {a.items && a.items.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {a.items.map(item => (
                            <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg3 transition-colors group">
                              <div className="mt-0.5 text-accent">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-text-main line-through opacity-70 group-hover:opacity-100 transition-opacity truncate">{item.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-text-faint">{item.project || 'No Project'}</span>
                                  {item.completedDate && (
                                    <span className="text-[10px] text-text-faint">• {new Date(item.completedDate).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-text-faint text-xs italic opacity-50 py-2 text-center">No items in this archive.</div>
                      )}
                    </div>
                  )}
                  
                  {expandedArchiveId !== a.id && (
                    <div className="text-[10px] text-text-faint mt-2 flex items-center gap-1 opacity-60">
                      <span>Click to view details</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  )}
                </div>
              ))}
              {archives.filter(a => a.quarter === q).length === 0 && (
                <div className="text-text-faint text-xs italic opacity-50 p-4 border border-dashed border-border-subtle rounded-lg text-center">No archives in {q.toUpperCase()}</div>
              )}
            </div>
          </div>
        ))}
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
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <div className="flex items-center gap-2.5 mb-6 group/folder-title">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder?.color || '#7c6af7' }}></div>
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
            className="text-xl font-serif font-medium bg-transparent border-none outline-none text-text-main w-full"
          />
        ) : (
          <>
            <h2 
              className="text-xl font-serif font-medium text-text-main cursor-pointer hover:underline decoration-dotted underline-offset-4"
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
              className="opacity-0 group-hover/folder-title:opacity-100 text-text-faint hover:text-text-main transition-opacity"
              title="Rename folder"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
          </>
        )}
        <span className="text-xs text-text-faint bg-bg3 px-2 py-0.5 rounded-full font-mono ml-2 shrink-0">
          {folderTasks.length} tasks
        </span>
      </div>

      {folderProjects.length === 0 ? (
        <div className="text-center py-10 text-text-faint italic">
          No projects in this folder.
        </div>
      ) : (
        folderProjects.map((project, index) => {
          const projectTasks = folderTasks.filter(t => t.project === project);
          
          return (
            <div key={`${project}-${index}`} className="mb-8">
              <div className="flex items-center gap-2 mb-3 border-b border-border-subtle pb-1 group/project-title">
                {editingProjectIndex === index ? (
                  <input
                    autoFocus
                    type="text"
                    value={editedProjectName}
                    onChange={(e) => setEditedProjectName(e.target.value)}
                    onBlur={(e) => handleRenameProject(project, index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameProject(project, index, e.currentTarget.value);
                      if (e.key === 'Escape') setEditingProjectIndex(null);
                    }}
                    className="font-mono text-xs uppercase tracking-wider bg-transparent border-none outline-none text-text-main w-full"
                  />
                ) : (
                  <>
                    <h3 
                      className="font-mono text-xs uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-main transition-colors"
                      onClick={() => {
                        setEditedProjectName(project);
                        setEditingProjectIndex(index);
                      }}
                    >
                      {project}
                    </h3>
                    <button
                      onClick={() => {
                        setEditedProjectName(project);
                        setEditingProjectIndex(index);
                      }}
                      className="opacity-0 group-hover/project-title:opacity-100 text-text-faint hover:text-text-main transition-opacity"
                      title="Rename project"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                  </>
                )}
                <span className="text-[10px] text-text-faint ml-auto">{projectTasks.length}</span>
              </div>
              <div className="flex flex-col">
                {projectTasks.length > 0 ? (
                  projectTasks.map(t => (
                    <TaskItem key={t.id} task={t} />
                  ))
                ) : (
                  <div className="text-xs text-text-faint italic py-2">No tasks in this project.</div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export const TagsView = () => {
  const { tasks, setTasks, tags, setTags } = useAppContext();
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#7c6af7');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

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

  const handleRenameTag = (tagId: string, newName: string) => {
    const oldTag = tags.find(t => t.id === tagId);
    if (!oldTag || oldTag.name === newName) {
      setEditingTagId(null);
      return;
    }

    setTags(prev => prev.map(t => t.id === tagId ? { ...t, name: newName } : t));
    setTasks(prev => prev.map(t => ({
      ...t,
      tags: t.tags.map(tag => tag === oldTag.name ? newName : tag)
    })));
    setEditingTagId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetTag: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          // Add tag if not present
          if (!t.tags.includes(targetTag)) {
            return { ...t, tags: [...t.tags, targetTag] };
          }
        }
        return t;
      }));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {tags.map(tag => {
          const tagTasks = tasks
            .filter(t => !t.deleted && !t.completed && t.tags.includes(tag.name))
            .sort((a, b) => a.title.localeCompare(b.title));

          return (
            <div 
              key={tag.id} 
              className="bg-bg2 rounded-xl border border-border-subtle flex flex-col max-h-[400px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => handleDrop(e, tag.name)}
            >
              <div 
                className="p-3 border-b border-border-subtle flex items-center justify-between shrink-0 rounded-t-xl bg-bg3/30" 
                style={{ borderTop: `3px solid ${tag.color}` }}
              >
                <div className="font-medium text-sm flex items-center gap-2" style={{ color: tag.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></span>
                  {editingTagId === tag.id ? (
                    <input
                      autoFocus
                      className="bg-bg3 border border-border-strong rounded px-1 py-0.5 text-sm text-text-main outline-none focus:border-accent"
                      value={editingTagName}
                      onChange={e => setEditingTagName(e.target.value)}
                      onBlur={() => handleRenameTag(tag.id, editingTagName)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameTag(tag.id, editingTagName);
                        if (e.key === 'Escape') setEditingTagId(null);
                      }}
                    />
                  ) : (
                    <span className="cursor-pointer" onClick={() => { setEditingTagId(tag.id); setEditingTagName(tag.name); }}>
                      {tag.name}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-faint bg-bg3 px-2 py-0.5 rounded-full font-mono">
                  {tagTasks.length}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[100px]">
                {tagTasks.length > 0 ? (
                  tagTasks.map(t => (
                    <TaskItem key={t.id} task={t} />
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-faint text-xs italic opacity-50 py-8">
                    <span>Drag tasks here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Tag Card */}
        <div className="bg-bg2 rounded-xl border border-dashed border-border-strong flex flex-col items-center justify-center p-6 min-h-[150px] hover:bg-bg3 transition-colors cursor-pointer group" onClick={() => setIsAddingTag(true)}>
          {!isAddingTag ? (
            <>
              <div className="w-10 h-10 rounded-full bg-bg3 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl text-text-muted">+</span>
              </div>
              <span className="text-sm font-medium text-text-muted">Add New Tag</span>
            </>
          ) : (
            <div className="w-full" onClick={e => e.stopPropagation()}>
              <input 
                autoFocus
                className="w-full bg-bg3 border border-border-strong rounded px-3 py-2 text-sm text-text-main outline-none focus:border-accent mb-3"
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
                    className="w-6 h-6 rounded-full border border-border-strong cursor-pointer"
                    style={{ backgroundColor: newTagColor }}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 z-50 hidden group-hover/color:block">
                    <div className="bg-bg border border-border-strong rounded-lg p-2 shadow-xl">
                      <HexColorPicker color={newTagColor} onChange={setNewTagColor} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAddingTag(false)}
                    className="text-xs text-text-muted hover:text-text-main px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateTag}
                    className="text-xs bg-accent text-white px-3 py-1 rounded hover:bg-accent2"
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
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-text-main">Trash</h2>
        {(deletedTasks.length > 0 || deletedFolders.length > 0) && (
          <button 
            onClick={emptyTrash}
            className="text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            Empty Trash
          </button>
        )}
      </div>

      {deletedFolders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">Deleted Folders</h3>
          <div className="flex flex-col gap-2">
            {deletedFolders.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }}></div>
                  <span className="text-sm text-text-main">{f.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => restoreFolder(f.id)} className="text-xs text-text-muted hover:text-text-main px-2 py-1 rounded hover:bg-bg3">Restore</button>
                  <button onClick={() => permanentDeleteFolder(f.id)} className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10">Delete Forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deletedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">Deleted Tasks</h3>
          <div className="flex flex-col gap-1">
            {deletedTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-border-subtle bg-bg2 group">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center border-text-faint`}></div>
                  <span className="text-[13.5px] text-text-main line-through opacity-70">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => restoreTask(t.id)} className="text-xs text-text-muted hover:text-text-main px-2 py-1 rounded hover:bg-bg3">Restore</button>
                  <button onClick={() => permanentDeleteTask(t.id)} className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10">Delete Forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deletedTasks.length === 0 && deletedFolders.length === 0 && (
        <div className="text-center text-text-faint text-sm mt-10">Trash is empty.</div>
      )}
    </div>
  );
};

export const UpcomingView = () => {
  const { tasks } = useAppContext();
  
  const sortTasks = (tasksToSort: typeof tasks) => {
    return [...tasksToSort].sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  };

  const tomorrowStr = getLocalDateString(new Date(new Date().setDate(new Date().getDate() + 1)));
  const tomorrowTasks = sortTasks(tasks.filter(t => !t.completed && !t.deleted && t.dueDate === tomorrowStr));

  return (
    <div className="flex-1 overflow-y-auto p-3 px-3.5 md:p-5 md:px-6">
      <div className="flex items-center gap-2.5 mb-2 mt-0">
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">Tomorrow — {new Date(tomorrowStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <div className="flex-1 h-[1px] bg-border-subtle"></div>
      </div>
      {tomorrowTasks.length > 0 ? tomorrowTasks.map(t => <TaskItem key={t.id} task={t} />) : (
        <div className="text-text-faint text-sm italic opacity-50 p-2">No tasks scheduled for tomorrow.</div>
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
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      displayDays.push({ 
        day: prevMonthDays - i, 
        isCurrentMonth: false, 
        date: new Date(year, month - 1, prevMonthDays - i) 
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      displayDays.push({ 
        day: i, 
        isCurrentMonth: true, 
        date: new Date(year, month, i) 
      });
    }
    
    // Next month days
    const remainingDays = 42 - displayDays.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      displayDays.push({ 
        day: i, 
        isCurrentMonth: false, 
        date: new Date(year, month + 1, i) 
      });
    }
  } else {
    // Week view
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

  // Filter tasks for the selected date
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
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const priorityColors: Record<string, string> = {
    p1: 'bg-red-500',
    p2: 'bg-orange-400',
    p3: 'bg-indigo-500',
    p4: 'bg-gray-400'
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg overflow-hidden h-full" data-purpose="calendar-view">
      {/* Header Section */}
      <header className="px-6 pt-6 pb-4 border-b border-border-subtle shrink-0" data-purpose="calendar-header">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main">{monthNames[month]} {year}</h1>
            <p className="text-sm text-text-muted font-medium">{remainingTasksThisMonth} tasks remaining this month</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 text-text-muted hover:text-text-main transition-colors"
              onClick={handlePrev}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className="p-2 text-text-muted hover:text-text-main transition-colors"
              onClick={handleNext}
            >
              <ChevronRight size={20} />
            </button>
            <button 
              className="p-2 bg-accent/10 text-accent rounded-full hover:bg-accent/20 transition-colors ml-2"
              onClick={() => setIsAddTaskOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>
        </div>
        {/* View Toggle */}
        <div className="flex bg-bg2 p-1 rounded-xl" data-purpose="view-toggle">
          <button 
            className={`flex-1 py-2 text-sm font-semibold text-center rounded-lg ${viewMode === 'month' ? 'bg-bg3 shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-semibold text-center rounded-lg ${viewMode === 'week' ? 'bg-bg3 shadow-sm text-text-main' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
        </div>
      </header>

      {/* Calendar Grid Section */}
      <section className="p-4 shrink-0" data-purpose="monthly-grid">
        {/* Days of Week Labels */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-bold text-text-muted uppercase tracking-wider">{day}</div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-y-2">
          {displayDays.map((dateObj, i) => {
            const isSelected = dateObj.date.getDate() === selectedDate.getDate() && 
                               dateObj.date.getMonth() === selectedDate.getMonth() && 
                               dateObj.date.getFullYear() === selectedDate.getFullYear();
            
            const dateStr = getLocalDateString(dateObj.date);
            const dayTasks = tasks.filter(t => t.dueDate === dateStr && !t.deleted && !t.completed);
            
            // Get up to 3 unique priority colors for the dots
            const dots = Array.from(new Set(dayTasks.map(t => t.priority))).slice(0, 3);

            return (
              <div 
                key={i} 
                className="h-14 flex flex-col items-center justify-center relative cursor-pointer"
                onClick={() => {
                  setSelectedDate(dateObj.date);
                  if (!dateObj.isCurrentMonth) {
                    setCurrentDate(dateObj.date);
                  }
                }}
              >
                {isSelected && <div className="absolute inset-2 bg-accent rounded-xl"></div>}
                <span className={`text-sm ${isSelected ? 'font-bold text-white relative z-10' : dateObj.isCurrentMonth ? 'font-medium text-text-main' : 'text-text-faint'}`}>
                  {dateObj.day}
                </span>
                
                {dayTasks.length > 0 && (
                  <div className={`flex gap-0.5 mt-1 ${isSelected ? 'relative z-10' : ''}`}>
                    {isSelected ? (
                      <>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        {dayTasks.length > 1 && <div className="w-1 h-1 bg-white/50 rounded-full"></div>}
                      </>
                    ) : (
                      dots.map((p, idx) => (
                        <div key={idx} className={`w-1 h-1 rounded-full ${priorityColors[p as string] || 'bg-accent'}`}></div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily Tasks List Section */}
      <section className="flex-1 bg-bg2 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.2)] px-6 pt-8 pb-10 overflow-y-auto no-scrollbar" data-purpose="selected-day-tasks">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-main">
            {fullDayNames[selectedDate.getDay()]}, {selectedDate.getDate()} {monthNames[selectedDate.getMonth()].substring(0, 3)}
          </h2>
          <span className="text-xs font-semibold px-2 py-1 bg-bg3 rounded-full text-text-muted">
            {sortedSelectedDayTasks.length} TASKS
          </span>
        </div>
        
        {/* Task Items */}
        <div className="space-y-4">
          {sortedSelectedDayTasks.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">No tasks for this day</div>
          ) : (
            sortedSelectedDayTasks.map(task => (
              <div key={task.id} className="flex items-start gap-4 p-4 bg-bg rounded-2xl shadow-sm cursor-pointer hover:bg-bg3 transition-colors" onClick={() => toggleTaskCompletion(task.id)} data-purpose="task-card">
                <div className={`w-1 h-12 rounded-full mt-1 ${priorityColors[task.priority] || 'bg-accent'}`}></div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate ${task.completed ? 'line-through text-text-faint' : 'text-text-main'}`}>
                    {task.title}
                  </h3>
                  <div className={`flex items-center gap-2 mt-1 text-sm ${task.completed ? 'text-text-faint' : 'text-text-muted'}`}>
                    {task.dueTime && (
                      <>
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="truncate">{task.dueTime}</span>
                      </>
                    )}
                    {task.project && (
                      <span className="truncate px-2 py-0.5 bg-bg3 rounded text-xs font-medium">{task.project}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task.id);
                  }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center mt-1 shrink-0 transition-colors ${
                    task.completed 
                      ? 'bg-accent border-accent' 
                      : 'border-2 border-border-strong hover:border-accent'
                  }`}
                >
                  {task.completed && (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path>
                    </svg>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
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
