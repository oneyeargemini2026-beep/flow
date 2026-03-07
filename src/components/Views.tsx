import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Brain, Flame } from 'lucide-react';
import { useAppContext } from '../store';
import { TaskItem } from './TaskItem';
import { getLocalDateString } from '../utils';
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
            stroke="var(--bg-bg3)"
            strokeWidth="6"
            fill="none"
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

export const TodayView = () => {
  const { tasks, setTasks, activeProject } = useAppContext();
  
  const baseTasks = activeProject 
    ? tasks.filter(t => t.project === activeProject && !t.deleted)
    : tasks.filter(t => !t.isInbox && !t.deleted);

  const sortTasks = (tasksToSort: typeof tasks) => {
    return [...tasksToSort].sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  };

  const overdue = sortTasks(baseTasks.filter(t => !t.completed && t.dueDate && t.dueDate < getLocalDateString()));
  // Only show tasks strictly due today, or tasks created today if no due date (optional, but sticking to due date for now)
  // Removing sortTasks for 'today' to allow manual reordering
  const today = baseTasks.filter(t => !t.completed && (t.dueDate === getLocalDateString()));
  
  // Filter completed tasks to only show those completed TODAY
  const completed = sortTasks(baseTasks.filter(t => t.completed && t.completedDate && t.completedDate.startsWith(getLocalDateString())));
  
  // Total for daily progress = (Overdue + Due Today) + Completed Today
  const totalTasks = overdue.length + today.length + completed.length;
  const completedCount = completed.length;

  const handleBrainDump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const title = e.currentTarget.value.trim();
      setTasks(prev => [{
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        priority: 'p4',
        tags: [],
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
          {activeProject ? 'Tasks' : 'Today'}
        </div>
        <div className="flex-1 h-[1px] bg-border-subtle"></div>
        {!activeProject && <div className="bg-accent/20 text-accent2 font-mono text-[10px] px-2 py-0.5 rounded">March 2</div>}
        <div className="font-mono text-[10px] text-text-faint">{today.length}</div>
      </div>
      
      {activeProject ? (
        <>
          {/* Group tasks by section */}
          {(() => {
            const sections = Array.from(new Set(today.map(t => t.section || '')));
            return sections.map(section => {
              const sectionTasks = today.filter(t => (t.section || '') === section);
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
                          // Only update section if it's different
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
                    <div className="font-serif text-sm text-text-muted mb-2 mt-4">{section}</div>
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
                  // Create a dummy completed task to hold the section if needed, or just add it to a new task
                  setTasks(prev => [{
                    id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: `New task in ${sectionName}`,
                    priority: 'p4',
                    tags: [],
                    completed: false,
                    project: activeProject,
                    section: sectionName
                  }, ...prev]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </>
      ) : (
        today.map(t => <TaskItem key={t.id} task={t} />)
      )}

      {completed.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 mb-2 mt-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">
              {activeProject ? 'Completed' : 'Completed today'}
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
                        {a.tags.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded border border-border-strong text-text-faint bg-bg3">{t}</span>
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

export const TagsView = () => {
  const { tasks, setTasks, tags, setTags } = useAppContext();
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#7c6af7');

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
                  {tag.name}
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tasks, setIsAddTaskOpen } = useAppContext();
  const [viewMode, setViewMode] = React.useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = React.useState(new Date());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 60;
    }
  }, [viewMode]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthDays = [];
  for (let i = 0; i < firstDay; i++) {
    monthDays.push({ day: '', isNextMonth: false, isEmpty: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push({ day: i, isNextMonth: false, isEmpty: false });
  }
  const remainingDays = 35 - monthDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    monthDays.push({ day: i, isNextMonth: true, isEmpty: false });
  }

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate week days for week view
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg relative">
      {/* Header */}
      <div className="hidden md:flex items-center justify-between p-3 px-4 md:px-6 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="font-sans text-lg md:text-xl font-medium">
            {viewMode === 'day' 
              ? `${dayNames[currentDate.getDay()]} ${monthNames[month]} ${currentDate.getDate()}, ${year}`
              : `${monthNames[month]} ${year}`}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-full hover:bg-bg3 text-text-muted transition-colors" onClick={handlePrev}><ChevronLeft size={20}/></button>
            <button className="p-1.5 rounded-full hover:bg-bg3 text-text-muted transition-colors" onClick={handleNext}><ChevronRight size={20}/></button>
            <button className="hidden md:block px-3 py-1.5 rounded-md border border-border-strong text-sm font-medium hover:bg-bg3 transition-colors ml-2" onClick={handleToday}>Today</button>
          </div>
        </div>
        <div className="flex bg-bg2 border border-border-strong rounded-md overflow-hidden">
          <button className={`hidden md:block px-4 py-1.5 text-sm font-medium border-r border-border-strong ${viewMode === 'day' ? 'bg-bg3 text-text-main' : 'hover:bg-bg3 text-text-muted'}`} onClick={() => setViewMode('day')}>Day</button>
          <button className={`px-3 md:px-4 py-1.5 text-sm font-medium border-r border-border-strong ${viewMode === 'week' ? 'bg-bg3 text-text-main' : 'hover:bg-bg3 text-text-muted'}`} onClick={() => setViewMode('week')}>Week</button>
          <button className={`px-3 md:px-4 py-1.5 text-sm font-medium ${viewMode === 'month' ? 'bg-bg3 text-text-main' : 'hover:bg-bg3 text-text-muted'}`} onClick={() => setViewMode('month')}>Month</button>
        </div>
      </div>

      {/* Mobile Month View */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden bg-bg">
        <div className="grid grid-cols-7 border-b border-border-subtle shrink-0 bg-bg2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-2 text-[11px] font-bold text-text-main">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto bg-bg">
          {monthDays.map((date, i) => (
            <div key={i} className="border-r border-b border-border-subtle p-0.5 flex flex-col items-center">
              {!date.isEmpty && (
                <div className={`mt-1 mb-1 w-6 h-6 flex items-center justify-center rounded-full text-[13px] font-bold ${date.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() && !date.isNextMonth ? 'bg-text-main text-bg' : 'text-text-main'} ${date.isNextMonth ? 'opacity-30' : ''}`}>
                  {date.day}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Floating Action Button */}
        <button 
          className="absolute bottom-6 right-6 w-[56px] h-[56px] bg-[#7aa2f7] text-[#0f172a] rounded-[18px] flex items-center justify-center shadow-lg hover:brightness-110 transition-all z-50"
          onClick={() => setIsAddTaskOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      {/* Desktop Week/Day View */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {/* Day Headers */}
        <div className="flex border-b border-border-subtle shrink-0 overflow-y-scroll no-scrollbar" style={{ scrollbarGutter: 'stable' }}>
          <div className="w-[50px] md:w-[60px] shrink-0 border-r border-border-subtle"></div>
          <div className={`flex-1 grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {viewMode === 'day' ? (
              <div className="flex flex-col items-center py-2 border-r border-border-subtle last:border-r-0">
                <span className="text-[10px] md:text-[11px] font-medium mb-1 text-accent">{dayNames[currentDate.getDay()]}</span>
                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-base md:text-lg bg-accent text-white">
                  {currentDate.getDate()}
                </div>
              </div>
            ) : (
              weekDays.map((date, i) => {
                const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
                return (
                  <div key={i} className="flex flex-col items-center py-2 border-r border-border-subtle last:border-r-0">
                    <span className={`text-[10px] md:text-[11px] font-medium mb-1 ${isToday ? 'text-accent' : 'text-text-muted'}`}>{dayNames[date.getDay()]}</span>
                    <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-base md:text-lg ${isToday ? 'bg-accent text-white' : 'text-text-main hover:bg-bg3 cursor-pointer'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto flex relative" ref={scrollRef}>
          {/* Time Labels */}
          <div className="w-[50px] md:w-[60px] shrink-0 border-r border-border-subtle bg-bg relative z-10">
            {Array.from({length: 23}).map((_, i) => (
              <div key={i} className="h-[60px] relative">
                <span className="absolute -top-2.5 right-2 text-[10px] text-text-muted font-mono">
                  {i + 1 === 12 ? '12 PM' : i + 1 > 12 ? `${i + 1 - 12} PM` : `${i + 1} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className={`flex-1 grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} relative`}>
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {Array.from({length: 24}).map((_, i) => (
                <div key={i} className="h-[60px] border-b border-border-subtle w-full shrink-0"></div>
              ))}
            </div>

            {/* Vertical Columns */}
            {Array.from({length: viewMode === 'day' ? 1 : 7}).map((_, dayIdx) => {
              const dayDate = viewMode === 'day' ? currentDate : weekDays[dayIdx];
              const dayStr = getLocalDateString(dayDate);
              const dayTasks = tasks.filter(t => t.dueDate === dayStr && t.dueTime && !t.deleted);

              return (
                <div key={dayIdx} className="relative border-r border-border-subtle last:border-r-0">
                  {dayTasks.map(t => {
                    const [hours, minutes] = t.dueTime!.split(':').map(Number);
                    const top = hours * 60 + minutes;
                    const height = 60; // Default 1 hour duration
                    
                    const colorMap: Record<string, string> = {
                      p1: 'bg-red/20 border-red/30 text-red',
                      p2: 'bg-orange/20 border-orange/30 text-orange',
                      p3: 'bg-accent/20 border-accent/30 text-accent2',
                      p4: 'bg-text-faint/20 border-text-faint/30 text-text-muted'
                    };

                    return (
                      <div 
                        key={t.id}
                        className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md p-1 md:p-1.5 text-xs overflow-hidden border hover:brightness-110 cursor-pointer transition-all ${colorMap[t.priority]}`} 
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="font-medium truncate text-[11px] md:text-xs">{t.title}</div>
                        <div className="text-[9px] md:text-[10px] opacity-80 truncate">{t.dueTime}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Current Time Indicator */}
            {(() => {
              const now = new Date();
              const isTodayInView = viewMode === 'day' 
                ? currentDate.getDate() === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()
                : weekDays.some(d => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
              
              if (!isTodayInView) return null;

              const dayIndex = viewMode === 'day' ? 0 : now.getDay();
              const minutes = now.getHours() * 60 + now.getMinutes();
              const top = minutes; // 1px per minute since each hour is 60px

              return (
                <div className="absolute left-0 right-0 pointer-events-none z-20" style={{ top: `${top}px` }}>
                  <div className="absolute left-0 w-full h-[2px] bg-red/50"></div>
                  <div className="absolute h-[2px] bg-red" style={{ 
                    left: viewMode === 'day' ? '0' : `calc(100% / 7 * ${dayIndex})`,
                    width: viewMode === 'day' ? '100%' : 'calc(100% / 7)'
                  }}></div>
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-red" style={{ 
                    left: viewMode === 'day' ? '-5px' : `calc(100% / 7 * ${dayIndex} - 5px)`, 
                    top: '-4px' 
                  }}></div>
                </div>
              );
            })()}
          </div>
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
