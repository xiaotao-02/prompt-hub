import { installChromePreviewShim } from './chromeShim';

installChromePreviewShim();

type MenuId = 'add' | 'extract' | 'video' | 'region';

type SceneSpec = {
  title: string;
  desc: string;
  menuIds: MenuId[];
  stageHtml: string;
  statusById: Partial<Record<MenuId, string>>;
};

const SCENES: Record<'image' | 'video' | 'page', SceneSpec> = {
  image: {
    title: '图片右键（image 上下文）',
    desc: '本页无法注册 <code>chrome.contextMenus</code>。在下方图片上<strong>右键</strong>可模拟生产环境子菜单：「添加参考」「提取提示词」。',
    menuIds: ['add', 'extract'],
    stageHtml:
      '<img class="ctx-demo-img" src="/icons/icon-128.png" alt="在演示区右键查看模拟扩展菜单" width="128" height="128" />',
    statusById: {
      add: '已模拟：添加参考（预览环境不请求后台）',
      extract: '已模拟：提取提示词（预览环境不请求后台）',
    },
  },
  video: {
    title: '视频右键（video 上下文）',
    desc: '在下方视频上<strong>右键</strong>可模拟生产环境子菜单：「添加参考」「提取提示词」「添加视频参考」。',
    menuIds: ['add', 'extract', 'video'],
    stageHtml:
      '<video class="ctx-demo-video" width="128" height="128" poster="/icons/icon-128.png" aria-label="在演示视频上右键查看模拟扩展菜单"></video>',
    statusById: {
      add: '已模拟：添加参考（预览环境不请求后台）',
      extract: '已模拟：提取提示词（预览环境不请求后台）',
      video: '已模拟：添加视频参考（预览环境不请求后台）',
    },
  },
  page: {
    title: '页面右键（page 上下文）',
    desc: '在下方空白区域<strong>右键</strong>可模拟生产环境菜单项：「截取添加参考」（站点劫持图片右键时的兜底入口）。',
    menuIds: ['region'],
    stageHtml: '<div class="ctx-demo-page-blank" tabindex="-1">在此空白处右键</div>',
    statusById: {
      region: '已模拟：截取添加参考（预览环境不请求后台）',
    },
  },
};

function readScene(): keyof typeof SCENES {
  const params = new URLSearchParams(window.location.search);
  const scene = (params.get('scene') || 'image').toLowerCase();
  if (scene in SCENES) return scene as keyof typeof SCENES;
  return 'image';
}

function initContextMenuPreview(): void {
  const sceneKey = readScene();
  const scene = SCENES[sceneKey];

  const titleEl = document.getElementById('ctx-demo-title');
  const descEl = document.getElementById('ctx-demo-desc');
  const stage = document.querySelector<HTMLElement>('[data-ctx-demo-stage]');
  const menu = document.getElementById('ctx-fake-menu');
  const statusEl = document.getElementById('ctx-demo-status');
  if (!titleEl || !descEl || !stage || !menu) return;
  const menuEl = menu;

  titleEl.textContent = scene.title;
  descEl.innerHTML = scene.desc;
  stage.innerHTML = scene.stageHtml;

  const menuItems = Array.from(
    menuEl.querySelectorAll<HTMLButtonElement>('.ctx-fake-menu-item[data-menu-id]'),
  );
  const visibleItems = menuItems.filter((btn) => {
    const id = btn.dataset.menuId as MenuId | undefined;
    const on = !!id && scene.menuIds.includes(id);
    btn.classList.toggle('is-visible', on);
    btn.hidden = !on;
    return on;
  });
  if (visibleItems.length === 0) return;

  let open = false;

  function closeMenu(): void {
    const was = open;
    open = false;
    menuEl.classList.remove('is-open');
    menuEl.setAttribute('aria-hidden', 'true');
    if (was) {
      document.removeEventListener('click', onDocClick, false);
      document.removeEventListener('keydown', onDocKey, true);
    }
  }

  function onDocClick(e: MouseEvent): void {
    if (e.target instanceof Node && menuEl.contains(e.target)) return;
    closeMenu();
  }

  function onDocKey(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  }

  function clampMenuPosition(): void {
    const pad = 8;
    const rect = menuEl.getBoundingClientRect();
    let left = parseFloat(menuEl.style.left);
    let top = parseFloat(menuEl.style.top);
    if (!Number.isFinite(left)) left = pad;
    if (!Number.isFinite(top)) top = pad;
    const maxL = window.innerWidth - rect.width - pad;
    const maxT = window.innerHeight - rect.height - pad;
    left = Math.min(Math.max(pad, left), maxL);
    top = Math.min(Math.max(pad, top), maxT);
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
  }

  function openMenuAt(clientX: number, clientY: number): void {
    closeMenu();
    open = true;
    menuEl.style.left = `${clientX}px`;
    menuEl.style.top = `${clientY}px`;
    menuEl.classList.add('is-open');
    menuEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      clampMenuPosition();
      try {
        visibleItems[0]?.focus();
      } catch {
        /* ignore */
      }
    });
    document.addEventListener('click', onDocClick, false);
    document.addEventListener('keydown', onDocKey, true);
  }

  stage.addEventListener(
    'contextmenu',
    (e) => {
      e.preventDefault();
      openMenuAt(e.clientX, e.clientY);
    },
    { capture: true },
  );

  for (const btn of visibleItems) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.menuId as MenuId | undefined;
      if (statusEl && id && scene.statusById[id]) {
        statusEl.textContent = scene.statusById[id]!;
      }
      closeMenu();
    });
  }

  window.addEventListener('resize', () => {
    if (open) clampMenuPosition();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') closeMenu();
  });
}

initContextMenuPreview();
