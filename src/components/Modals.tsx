import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Task } from '../types';
import { getLocalDateString, parseTaskInput } from '../utils';

export const AddTaskModal = () => {
  const { isAddTaskOpen, setIsAddTaskOpen, setTasks, activeProject, folders, tags: globalTags, setTags: setGlobalTags, goals } = useAppContext();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('p1');
  const [dueDate, setDueDate] = useState(getLocalDateString());
  const [dueTime, setDueTime] = useState('');
  const [project, setProject] = useState('');
  const [section, setSection] = useState('');
  const [goalId, setGoalId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (isAddTaskOpen) {
      setProject(activeProject || '');
      setSection('');
      setGoalId('');
      setTags([]);
      setIsAddingTag(false);
      setNewTagName('');
    }
  }, [isAddTaskOpen, activeProject]);

  if (!isAddTaskOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const { title: parsedTitle, tags: parsedTags } = parseTaskInput(title);

    // Add new tags to global tags
    parsedTags.forEach(tagName => {
      if (!globalTags.find(t => t.name === tagName)) {
        const newTag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: tagName,
          color: '#7c6af7'
        };
        setGlobalTags(prev => [...prev, newTag]);
      }
    });

    const finalTags = [...new Set([...tags, ...parsedTags])];

    const newTask: Task = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: parsedTitle,
      priority: priority as any,
      dueDate,
      dueTime,
      project,
      section: section.trim() || undefined,
      goalId: goalId || undefined,
      tags: finalTags,
      completed: false
    };
    setTasks(prev => [...prev, newTask]);
    setIsAddTaskOpen(false);
    setTitle('');
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddNewTag = () => {
    const tagName = newTagName.trim();
    if (tagName) {
      // Add to global tags if not exists
      if (!globalTags.find(t => t.name === tagName)) {
        const newTag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: tagName,
          color: '#7c6af7'
        };
        setGlobalTags(prev => [...prev, newTag]);
      }
      
      // Select the tag
      if (!tags.includes(tagName)) {
        setTags(prev => [...prev, tagName]);
      }
    }
    setNewTagName('');
    setIsAddingTag(false);
  };

  return (
    <div className="fixed inset-0 bg-bg/70 z-50 flex items-end md:items-center justify-center backdrop-blur-[4px] p-4" onClick={() => setIsAddTaskOpen(false)}>
      <div className="bg-bg2 border border-border-strong rounded-[14px] w-full max-w-[520px] max-h-[85vh] overflow-y-auto p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]" onClick={e => e.stopPropagation()}>
        <div className="font-serif text-xl mb-5">New Task</div>
        
        <div className="mb-4">
          <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Task</label>
          <input 
            type="text" 
            placeholder="What needs to be done?" 
            className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none transition-colors focus:border-accent"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Priority</label>
            <select 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none cursor-pointer"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="p1">P1 — Critical</option>
              <option value="p2">P2 — High</option>
              <option value="p3">P3 — Medium</option>
              <option value="p4">P4 — Low</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Project</label>
            <select 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none cursor-pointer"
              value={project}
              onChange={e => setProject(e.target.value)}
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
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Section</label>
            <input 
              type="text" 
              placeholder="e.g. Phase 1" 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none transition-colors focus:border-accent"
              value={section}
              onChange={e => setSection(e.target.value)}
              disabled={!project}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Goal</label>
            <select 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none cursor-pointer"
              value={goalId}
              onChange={e => setGoalId(e.target.value)}
            >
              <option value="">No Goal</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Due date</label>
            <input 
              type="date" 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none focus:border-accent"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Time</label>
            <input 
              type="time" 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none focus:border-accent"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {globalTags.map(tag => (
              <div 
                key={tag.id}
                className={`px-2.5 py-[3px] rounded-full text-[11px] font-mono cursor-pointer border transition-colors ${tags.includes(tag.name) ? 'bg-accent/20 border-accent text-accent2' : 'border-border-strong text-text-muted hover:border-accent hover:text-accent2'}`}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </div>
            ))}
            {isAddingTag ? (
              <input
                type="text"
                autoFocus
                className="px-2.5 py-[3px] rounded-full text-[11px] font-mono border border-accent text-text-main bg-transparent outline-none w-[100px]"
                placeholder="Tag name..."
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddNewTag();
                  if (e.key === 'Escape') setIsAddingTag(false);
                }}
                onBlur={() => {
                   if (newTagName.trim()) handleAddNewTag();
                   else setIsAddingTag(false);
                }}
              />
            ) : (
              <div 
                className="px-2.5 py-[3px] rounded-full text-[11px] font-mono cursor-pointer border border-dashed border-border-strong text-text-faint hover:border-accent hover:text-accent2"
                onClick={() => setIsAddingTag(true)}
              >
                ＋ new tag
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-5">
          <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-transparent text-text-muted border border-border-strong hover:bg-bg3 hover:text-text-main" onClick={() => setIsAddTaskOpen(false)}>Cancel</button>
          <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none" onClick={handleSave}>Add Task</button>
        </div>
      </div>
    </div>
  );
};

export const ProcessInboxModal = () => {
  const { isProcessInboxOpen, setIsProcessInboxOpen, tasks, setTasks, folders, goals } = useAppContext();
  const inboxTasks = tasks.filter(t => t.isInbox && !t.completed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState('p1');
  const [goalId, setGoalId] = useState('');

  useEffect(() => {
    setProject('');
    setPriority('p1');
    setGoalId('');
  }, [currentIndex, isProcessInboxOpen]);

  if (!isProcessInboxOpen) return null;

  const currentTask = inboxTasks[currentIndex];

  const handleOrganize = () => {
    if (currentTask) {
      setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, isInbox: false, project: project || undefined, priority: priority as any, goalId: goalId || undefined } : t));
    }
    if (currentIndex < inboxTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsProcessInboxOpen(false);
      setCurrentIndex(0);
    }
  };

  const handleSkip = () => {
    if (currentIndex < inboxTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsProcessInboxOpen(false);
      setCurrentIndex(0);
    }
  };

  const handleDelete = () => {
    if (currentTask) {
      setTasks(prev => prev.filter(t => t.id !== currentTask.id));
    }
    if (currentIndex < inboxTasks.length - 1) {
      // Don't increment index because the array shrinks
    } else {
      setIsProcessInboxOpen(false);
      setCurrentIndex(0);
    }
  };

  if (!currentTask) {
    return (
      <div className="fixed inset-0 bg-bg/70 z-50 flex items-end md:items-center justify-center backdrop-blur-[4px] p-4" onClick={() => setIsProcessInboxOpen(false)}>
        <div className="bg-bg2 border border-border-strong rounded-[14px] w-full max-w-[500px] p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-center" onClick={e => e.stopPropagation()}>
          <div className="text-[32px] mb-3">✦</div>
          <div className="font-serif text-xl mb-2">Inbox Zero</div>
          <div className="text-[13px] text-text-faint">All items processed. You're clear.</div>
          <button className="mt-5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none" onClick={() => setIsProcessInboxOpen(false)}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg/70 z-50 flex items-end md:items-center justify-center backdrop-blur-[4px] p-4" onClick={() => setIsProcessInboxOpen(false)}>
      <div className="bg-bg2 border border-border-strong rounded-[14px] w-full max-w-[500px] p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="font-serif text-xl">Process Inbox</div>
          <span className="font-mono text-[11px] text-text-faint">{currentIndex + 1} of {inboxTasks.length}</span>
        </div>
        <div className="h-[3px] bg-bg3 rounded-[2px] mb-5">
          <div className="h-full bg-accent rounded-[2px] transition-all" style={{ width: `${((currentIndex) / inboxTasks.length) * 100}%` }}></div>
        </div>
        
        <div className="text-[17px] text-text-main mb-5 font-medium min-h-[26px]">
          {currentTask.title}
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Project</label>
            <select 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none cursor-pointer"
              value={project}
              onChange={e => setProject(e.target.value)}
            >
              <option value="">No project</option>
              {folders.map(f => (
                <optgroup key={f.id} label={f.name}>
                  {f.projects.map((p, index) => (
                    <option key={`${f.id}-${p}-${index}`} value={p}>{p}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Goal</label>
            <select 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none cursor-pointer"
              value={goalId}
              onChange={e => setGoalId(e.target.value)}
            >
              <option value="">No Goal</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-mono text-text-faint mb-1.5 block uppercase tracking-[0.08em]">Priority</label>
            <select 
              className="w-full bg-bg3 border border-border-strong rounded-lg px-3 py-2 text-text-main text-sm font-sans outline-none cursor-pointer"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="p1">P1 — Critical</option>
              <option value="p2">P2 — High</option>
              <option value="p3">P3 — Medium</option>
              <option value="p4">P4 — Low</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-transparent text-text-faint border border-border-strong hover:bg-bg3 hover:text-text-muted" onClick={handleSkip}>Skip for now</button>
          <div className="flex gap-2">
            <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-transparent text-red border border-border-strong hover:bg-bg3" onClick={handleDelete}>Delete</button>
            <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none" onClick={handleOrganize}>Organize →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FocusOverlay = () => {
  const { isFocusOpen, setIsFocusOpen } = useAppContext();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setSessions(prev => prev + 1);
      setTimeLeft(5 * 60); // Break time
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!isFocusOpen) return null;

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-[#0a0a0c]/95 z-[100] flex flex-col items-center justify-center backdrop-blur-[20px] p-6">
      <button 
        className="absolute top-4 right-4 md:top-6 md:right-6 bg-bg3 border border-border-strong text-text-muted px-4 py-2 rounded-lg cursor-pointer text-[13px] hover:text-text-main"
        onClick={() => { setIsFocusOpen(false); setIsRunning(false); }}
      >
        ✕ Exit focus
      </button>
      
      <div className="font-serif text-[72px] md:text-[96px] text-text-main tracking-[-4px] leading-none mb-4">{m}:{s}</div>
      <div className="text-base md:text-lg text-text-muted mb-8 md:mb-10 max-w-[400px] text-center">
        {timeLeft === 5 * 60 && !isRunning && sessions > 0 ? 'Break time — well done!' : ''}
      </div>
      
      <div className="flex gap-3 items-center">
        <button 
          className="px-7 py-3 rounded-[10px] text-[15px] font-medium cursor-pointer transition-colors bg-accent text-white hover:bg-accent2 border-none"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Pause' : (timeLeft === 5 * 60 && sessions > 0 ? 'Start break' : 'Start')}
        </button>
        <button 
          className="px-7 py-3 rounded-[10px] text-[15px] font-medium cursor-pointer transition-colors bg-bg3 text-text-muted border border-border-strong hover:bg-bg4 hover:text-text-main"
          onClick={() => { setIsRunning(false); setTimeLeft(25 * 60); }}
        >
          Reset
        </button>
      </div>
      
      <div className="flex gap-2 mt-8">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-2.5 h-2.5 rounded-full transition-all ${i < sessions ? 'bg-accent' : i === sessions ? 'bg-red shadow-[0_0_12px_var(--color-red)]' : 'bg-bg3'}`}
          ></div>
        ))}
      </div>
      <div className="font-mono text-[11px] text-text-faint mt-4">
        Session {Math.min(sessions + 1, 4)} of 4 · {sessions} completed today
      </div>
    </div>
  );
};
