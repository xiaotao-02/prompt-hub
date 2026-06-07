/**
 * 注入到 Shadow DOM 的样式表。拆分为 styleSections/ 便于维护；
 * 通过字符串拼接保持与原先单文件 STYLE 完全一致。
 *
 * 注意：这是字符串常量，不是 .css 文件——content script 必须把它通过
 * <style>.textContent 注入到 Shadow Root，不能依赖 vite 的 CSS import。
 */
import { PANEL_THEME_CSS } from './tokens';
import { shellCss } from './styleSections/shell';
import { headerCss } from './styleSections/header';
import { referencesCss } from './styleSections/references';
import { composeCss } from './styleSections/compose';
import { editorCss } from './styleSections/editor';
import { videoShotsCss } from './styleSections/videoShots';
import { metaCss } from './styleSections/meta';
import { refineCss } from './styleSections/refine';
import { versionsCss } from './styleSections/versions';
import { dropdownCss } from './styleSections/dropdown';
import { buttonsCss } from './styleSections/buttons';
import { loadingCss } from './styleSections/loading';

export const STYLE = [
  PANEL_THEME_CSS,
  shellCss,
  headerCss,
  referencesCss,
  composeCss,
  editorCss,
  videoShotsCss,
  metaCss,
  refineCss,
  versionsCss,
  dropdownCss,
  buttonsCss,
  loadingCss,
].join('');
