import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/storage', () => ({
  listRecentHistory: vi.fn().mockResolvedValue([]),
  removeHistory: vi.fn(),
  getSettings: vi.fn().mockResolvedValue({ provider: 'openai' }),
  LIBRARY_REV_KEY: 'library-rev',
}));
vi.mock('@/lib/messaging/openSurfaces', () => ({
  sendOpenInPanel: vi.fn(),
  sendOpenOptions: vi.fn(),
}));
vi.mock('./usePopupVersionsDetail', () => ({
  usePopupVersionsDetail: () => ({
    versionsExpandedId: null,
    versionsDetailItem: null,
    toggleVersionsPanel: vi.fn(),
    refreshVersionsDetailAfterMutation: vi.fn(),
    collapseVersionsForItem: vi.fn(),
  }),
}));

import PopupApp from './PopupApp';

describe('PopupApp smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders extension title and library nav', async () => {
    render(<PopupApp />);
    expect(await screen.findByText(/Prompt Hub/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开提示词库' })).toBeInTheDocument();
  });
});
