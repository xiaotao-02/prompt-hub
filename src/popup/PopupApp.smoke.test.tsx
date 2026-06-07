import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HistoryItem } from '@/lib/types';

const sampleHistoryItem: HistoryItem = {
  id: 'hist-1',
  prompt: 'test prompt',
  provider: 'openai',
  model: 'gpt-4o-mini',
  style: 'natural-zh',
  imageUrl: 'https://example.com/a.jpg',
  thumbnail: 'https://example.com/a.jpg',
  pageUrl: 'https://example.com',
  pageTitle: 'Example',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  versions: [],
};

const { listRecentHistory, getSettings, mockSettings } = vi.hoisted(() => {
  const settings = {
    activeProvider: 'openai' as const,
    providers: {
      openai: {
        id: 'openai' as const,
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      },
    },
  };
  return {
    mockSettings: settings,
    listRecentHistory: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue(settings),
  };
});

vi.mock('@/lib/storage', () => ({
  listRecentHistory,
  removeHistory: vi.fn(),
  getSettings,
  saveSettings: vi.fn().mockResolvedValue(undefined),
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
import { POPUP_ROOT_CLASS, POPUP_SCROLL_CLASS } from './popupShell';

describe('PopupApp smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRecentHistory.mockResolvedValue([]);
    getSettings.mockResolvedValue(mockSettings);
  });

  it('renders extension title and library nav', async () => {
    render(<PopupApp />);
    expect(await screen.findByText(/Prompt Hub/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开提示词库' })).toBeInTheDocument();
    const root = document.querySelector('[data-popup-root]');
    for (const cls of POPUP_ROOT_CLASS.split(/\s+/)) {
      expect(root).toHaveClass(cls);
    }
    expect(root?.className).not.toMatch(/vh|vw|dvh/);
    const scroll = document.querySelector('[data-popup-scroll]');
    for (const cls of POPUP_SCROLL_CLASS.split(/\s+/)) {
      expect(scroll).toHaveClass(cls);
    }
    expect(scroll?.className).toMatch(/max-h-\[548px\]/);
  });

  it('empty list and unconfigured shows inline service card and compact empty hint', async () => {
    render(<PopupApp />);
    expect(await screen.findByText('完成下方配置后即可在顶部管理账户与 API')).toBeInTheDocument();
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
    expect(screen.getByText(/右键图片「提取图片提示词」，或使用顶部「截取」/)).toBeInTheDocument();
    expect(
      screen
        .queryAllByRole('button', { hidden: true })
        .filter((el) => el.getAttribute('aria-haspopup') === 'dialog'),
    ).toHaveLength(0);
    expect(screen.queryByText('在网页图片上右键，选择「提取图片提示词」')).not.toBeInTheDocument();
  });

  it('empty list keeps inline service card open while typing API key', async () => {
    render(<PopupApp />);
    expect(await screen.findByText('完成下方配置后即可在顶部管理账户与 API')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('sk-...'), {
      target: { value: 'sk-test-key-12345' },
    });
    expect(screen.getByText('完成下方配置后即可在顶部管理账户与 API')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存配置' })).toBeInTheDocument();
  });

  it('empty list hides inline service card after 保存配置', async () => {
    render(<PopupApp />);
    expect(await screen.findByText('完成下方配置后即可在顶部管理账户与 API')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('sk-...'), {
      target: { value: 'sk-test-key-12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存配置' }));
    await waitFor(() => {
      expect(screen.queryByText('完成下方配置后即可在顶部管理账户与 API')).not.toBeInTheDocument();
    });
    expect(
      screen.getAllByRole('button').filter((el) => el.getAttribute('aria-haspopup') === 'dialog'),
    ).toHaveLength(1);
  });

  it('service menu opens and closes on trigger click', async () => {
    render(<PopupApp />);
    expect(await screen.findByText('完成下方配置后即可在顶部管理账户与 API')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('sk-...'), {
      target: { value: 'sk-test-key-12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存配置' }));
    await waitFor(() => {
      expect(screen.queryByText('完成下方配置后即可在顶部管理账户与 API')).not.toBeInTheDocument();
    });

    const trigger = screen
      .getAllByRole('button')
      .find((el) => el.getAttribute('aria-haspopup') === 'dialog');
    expect(trigger).toBeDefined();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger!);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: '服务设置' })).toBeInTheDocument();

    fireEvent.click(trigger!);
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
    await waitFor(
      () => {
        expect(screen.queryByRole('dialog', { name: '服务设置' })).not.toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it('does not flash service menu while history is loading on empty unconfigured popup', async () => {
    let resolveHistory: (items: HistoryItem[]) => void = () => {};
    listRecentHistory.mockImplementation(
      () =>
        new Promise<HistoryItem[]>((resolve) => {
          resolveHistory = resolve;
        }),
    );

    render(<PopupApp />);
    await waitFor(() => expect(getSettings).toHaveBeenCalled());

    expect(
      screen.queryAllByRole('button').filter((el) => el.getAttribute('aria-haspopup') === 'dialog'),
    ).toHaveLength(0);
    expect(screen.queryByText('完成下方配置后即可在顶部管理账户与 API')).not.toBeInTheDocument();

    resolveHistory([]);
    expect(await screen.findByText('完成下方配置后即可在顶部管理账户与 API')).toBeInTheDocument();
    expect(
      screen.queryAllByRole('button').filter((el) => el.getAttribute('aria-haspopup') === 'dialog'),
    ).toHaveLength(0);
  });

  it('history with items and unconfigured shows service menu not inline card', async () => {
    listRecentHistory.mockResolvedValue([sampleHistoryItem]);
    render(<PopupApp />);
    expect(await screen.findByText('test prompt')).toBeInTheDocument();
    expect(document.querySelector('[data-popup-scroll]')).toBeInTheDocument();
    expect(screen.queryByText('完成下方配置后即可在顶部管理账户与 API')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button').filter((el) => el.getAttribute('aria-haspopup') === 'dialog'),
    ).toHaveLength(1);
    expect(
      screen.queryByText(/右键图片「提取图片提示词」，或使用顶部「截取」/),
    ).not.toBeInTheDocument();
  });
});
