import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PopupApp from './PopupApp';
import { POPUP_BODY_CLASS } from './popupShell';
import '@/styles/globals.css';

document.body.className = POPUP_BODY_CLASS;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
