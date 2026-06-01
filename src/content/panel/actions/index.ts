import type { DataActionHandler } from './types';
import { handleClose, handleComposeSetMode, handleRunExtract, handleVideoSegment } from './compose';
import { handleRemoveReference, handleAddRefUrl, handlePickRefFile } from './references';
import { handleCopy, handleRetry } from './copyAndRetry';
import { handleOpenOptions, handleOpenInLibrary } from './navigation';
import {
  handleToggleVersionsDensity,
  handleToggleVersions,
  handleSave,
  handleCopyVersion,
  handleLoadOrSelectVersion,
  handleRestoreVersion,
  handleDeleteVersion,
} from './versions';
import {
  handleOpenRefineSettings,
  handleToggleRefine,
  handleOneClickRefine,
  handleRefineSuggest,
  handleRunRefine,
} from './refine';

export const DATA_ACTION_HANDLERS: Record<string, DataActionHandler> = {
  close: handleClose,
  'compose-set-mode': handleComposeSetMode,
  'run-extract': handleRunExtract,
  'run-extract-material': handleRunExtract,
  'run-extract-style': handleRunExtract,
  'remove-reference': handleRemoveReference,
  'add-ref-url': handleAddRefUrl,
  'pick-ref-file': handlePickRefFile,
  'sample-video-segment-to-refs': handleVideoSegment,
  'extract-video-segment': handleVideoSegment,
  copy: handleCopy,
  retry: handleRetry,
  'open-options': handleOpenOptions,
  'open-in-library': handleOpenInLibrary,
  'toggle-versions-density': handleToggleVersionsDensity,
  'toggle-versions': handleToggleVersions,
  save: handleSave,
  'copy-version': handleCopyVersion,
  'load-version': handleLoadOrSelectVersion,
  'select-version': handleLoadOrSelectVersion,
  'restore-version': handleRestoreVersion,
  'delete-version': handleDeleteVersion,
  'open-refine-settings': handleOpenRefineSettings,
  'toggle-refine': handleToggleRefine,
  'one-click-refine': handleOneClickRefine,
  'refine-suggest': handleRefineSuggest,
  'run-refine': handleRunRefine,
};

export {
  handleClose,
  handleComposeSetMode,
  handleRunExtract,
  handleVideoSegment,
  syncComposeCollectModeUi,
  sendComposeExtractPrompt,
} from './compose';
export { handleRemoveReference, handleAddRefUrl, handlePickRefFile } from './references';
export { handleCopy, handleRetry } from './copyAndRetry';
export { handleOpenOptions, handleOpenInLibrary } from './navigation';
export {
  handleToggleVersionsDensity,
  handleToggleVersions,
  handleSave,
  handleCopyVersion,
  handleLoadOrSelectVersion,
  handleRestoreVersion,
  handleDeleteVersion,
} from './versions';
export {
  handleOpenRefineSettings,
  handleToggleRefine,
  handleOneClickRefine,
  handleRefineSuggest,
  handleRunRefine,
} from './refine';
