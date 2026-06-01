import { describe, expect, it } from 'vitest';
import { UI_ACTION, UI_NAV, UI_SURFACE } from './uiCopy';
import { UI_COPY_FEEDBACK_MS, UI_ACTION_TIP_MS } from './uiFeedback';

describe('uiCopy', () => {
  it('uses consistent surface names across entry points', () => {
    expect(UI_SURFACE.popup).toBe('工具栏弹窗');
    expect(UI_SURFACE.contentPanel).toBe('网页浮动面板');
    expect(UI_SURFACE.library).toBe('提示词库');
  });

  it('aligns recall action label with content panel terminology', () => {
    expect(UI_ACTION.recallToPanel).toBe('浮动面板');
    expect(UI_NAV.openLibrary).toBe('提示词库');
  });
});

describe('uiFeedback', () => {
  it('uses unified durations for copy and action tips', () => {
    expect(UI_COPY_FEEDBACK_MS).toBe(1200);
    expect(UI_ACTION_TIP_MS).toBe(2000);
  });
});
