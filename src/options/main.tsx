import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installSurfaceErrorLogger } from '@/lib/surfaceErrorLogger';
import OptionsApp from './OptionsApp';
import '@/styles/globals.css';

installSurfaceErrorLogger('options');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
