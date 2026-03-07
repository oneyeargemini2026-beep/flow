import React, { useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './store';
import { Sidebar, Topbar } from './components/Layout';
import { TodayView, InboxView, UpcomingView, DashboardView, MatrixView, CalendarView, ArchiveView, TrashView, HistoryView, TagsView } from './components/Views';
import { AddTaskModal, ProcessInboxModal, FocusOverlay } from './components/Modals';

const MainContent = () => {
  const { currentView, tasks } = useAppContext();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

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
            new Notification(`Task Due: ${task.title}`, {
              body: `It's time for ${task.title}`,
            });
            notifiedRef.current.add(key);
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
