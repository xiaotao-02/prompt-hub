import {
  parseRefineJobSentinel,
  refineStreamSentinelForJob,
  REFINE_STREAM_VERSION_ID,
} from '@/lib/streamVersionSentinels';
import { panelRefineJobs, type PanelRefineJob, type PanelState } from '../state';
import { removeRefineJobById } from '../refineHelpers';
import type { PanelEvent, PanelStateTransition } from './panelEvents';

export function applyRefineEnqueue(
  state: PanelState,
  job: PanelRefineJob,
  refineInstruction: string,
): PanelStateTransition {
  return {
    changed: true,
    state: {
      ...state,
      refineJobs: [...panelRefineJobs(state), job],
      refineError: undefined,
      refineInstruction,
      selectedVersionId: refineStreamSentinelForJob(job.jobId),
      versionsOpen: true,
    },
  };
}

export function applyRefineDequeue(
  state: PanelState,
  jobId: string,
  refineError?: string,
): PanelStateTransition {
  const next = removeRefineJobById(state, jobId);
  if (refineError !== undefined) {
    return { changed: true, state: { ...next, refineError } };
  }
  if (next.refineError === state.refineError && next.refineJobs === state.refineJobs) {
    return { changed: false, state };
  }
  return { changed: true, state: next };
}

export function applyRefineProgress(
  state: PanelState,
  event: Extract<PanelEvent, { type: 'refine.progress' }>,
): PanelStateTransition {
  const jobs = [...panelRefineJobs(state)];
  if (jobs.length === 0) return { changed: false, state };

  const patchJob = (j: PanelRefineJob): PanelRefineJob => ({
    ...j,
    ...(event.stage !== undefined ? { stage: event.stage } : {}),
    ...(event.partial !== undefined ? { partial: event.partial } : {}),
    ...(event.streamMode !== undefined ? { streamMode: event.streamMode } : {}),
  });

  let nextJobs: PanelRefineJob[];
  if (event.refineJobId) {
    const ix = jobs.findIndex((x) => x.jobId === event.refineJobId);
    if (ix < 0) return { changed: false, state };
    nextJobs = jobs.map((j, i) => (i === ix ? patchJob(j) : j));
  } else if (jobs.length === 1) {
    nextJobs = [patchJob(jobs[0]!)];
  } else {
    return { changed: false, state };
  }

  return { changed: true, state: { ...state, refineJobs: nextJobs } };
}

export function applyRefineComplete(
  state: PanelState,
  jobId: string,
  prompt: string,
  versionId?: string,
  prevSelectedVersionId?: string,
): PanelStateTransition {
  let next = removeRefineJobById(state, jobId);
  const stillRefining = panelRefineJobs(next).length > 0;
  const prevSel = prevSelectedVersionId ?? state.selectedVersionId;
  const viewingCompleted =
    prevSel === refineStreamSentinelForJob(jobId) ||
    prevSel === REFINE_STREAM_VERSION_ID ||
    parseRefineJobSentinel(prevSel ?? undefined) === jobId;
  let nextSel = prevSel;
  if (
    !stillRefining ||
    viewingCompleted ||
    parseRefineJobSentinel(prevSel ?? undefined) === jobId
  ) {
    nextSel = versionId;
  }
  next = {
    ...next,
    refineError: undefined,
    refineInstruction: stillRefining ? next.refineInstruction : '',
    refineOpen: stillRefining ? next.refineOpen : false,
    prompt,
    draft: prompt,
    versionsOpen: true,
    selectedVersionId: nextSel,
  };
  return { changed: true, state: next };
}
