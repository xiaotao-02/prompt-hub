import type { PanelState } from './state';
import { panelRefineJobs } from './state';

export function removeRefineJobById(state: PanelState, jobId: string): PanelState {
  const jobs = panelRefineJobs(state).filter((j) => j.jobId !== jobId);
  return { ...state, refineJobs: jobs.length ? jobs : undefined };
}
