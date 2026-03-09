import React, { useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './store';
import { Sidebar, Topbar } from './components/Layout';
import { TodayView, InboxView, UpcomingView, DashboardView, MatrixView, CalendarView, ArchiveView, TrashView, HistoryView, TagsView, FolderView, ProjectView, GoalsView } from './components/Views';
import { AddTaskModal, ProcessInboxModal, FocusOverlay } from './components/Modals';

const MainContent = () => {
  const { currentView, tasks } = useAppContext();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PLAY_BELL') {
          playBell();
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const playBell = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/ding_ding_ding.ogg');
    audio.play().catch(e => console.error('Audio play failed:', e));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      tasks.forEach(task => {
        if (!task.completed && !task.deleted && task.dueDate === todayStr && task.dueTime === currentTime) {
          const key = `${task.id}-${currentTime}`;
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(`Task Due: ${task.title}`, {
                  body: `It's time for ${task.title}`,
                  icon: '/icon.svg',
                  // @ts-ignore
                  vibrate: [200, 100, 200]
                });
                playBell();
              });
            } else {
              new Notification(`Task Due: ${task.title}`, {
                body: `It's time for ${task.title}`,
                icon: '/icon.svg'
              });
              playBell();
            }
          }
        }
      });
    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    const registerPeriodicSync = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if periodicSync is supported
        if ('periodicSync' in registration) {
          try {
            const status = await navigator.permissions.query({
              // @ts-ignore
              name: 'periodic-background-sync',
            });
            if (status.state === 'granted') {
              // @ts-ignore
              await registration.periodicSync.register('content-sync', {
                minInterval: 24 * 60 * 60 * 1000, // 1 day
              });
              console.log('Periodic sync registered');
            } else {
              console.log('Periodic sync permission not granted');
            }
          } catch (error) {
            console.error('Periodic sync registration failed:', error);
          }
        }
      }
    };
    registerPeriodicSync();
  }, []);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-bg">
      <Topbar />
      <div className="flex-1 overflow-hidden flex">
        {currentView === 'today' && <TodayView />}
        {currentView === 'inbox' && <InboxView />}
        {currentView === 'upcoming' && <UpcomingView />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'matrix' && <MatrixView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'archive' && <ArchiveView />}
        {currentView === 'tags' && <TagsView />}
        {currentView === 'goals' && <GoalsView />}
        {currentView === 'folder' && <FolderView />}
        {currentView === 'project' && <ProjectView />}
        {currentView === 'trash' && <TrashView />}
        {currentView === 'history' && <HistoryView />}
      </div>
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-row h-screen w-screen bg-bg text-text-main font-sans overflow-hidden">
        <Sidebar />
        <MainContent />
        <AddTaskModal />
        <ProcessInboxModal />
        <FocusOverlay />
      </div>
    </AppProvider>
  );
}
