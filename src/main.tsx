import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {polyfill} from 'mobile-drag-drop';
import {scrollBehaviourDragImageTranslateOverride} from 'mobile-drag-drop/scroll-behaviour';
import 'mobile-drag-drop/default.css';
import App from './App.tsx';
import './index.css';

import { FirebaseProvider } from './context/FirebaseContext';

// Initialize drag-and-drop polyfill for mobile devices
polyfill({
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
  holdToDrag: 300 // Press and hold for 300ms to start dragging on touch devices
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>,
);
