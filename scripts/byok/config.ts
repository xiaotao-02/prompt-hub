/** 导出 BYOK 公开仓时整目录排除（相对仓库根） */
export const EXPORT_EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-zip',
  '.git',
  '.export-byok-test',
  'services',
  'website',
  'hc-1',
  '.export-byok-test',
  '.chrome-dev-profile',
  '.chrome-cdp-debug-profile',
  'store-assets/libtv/raw',
  'store-assets/libtv/.libtv',
]);

/** 导出后删除的路径（相对仓库根） */
export const BYOK_DELETE_PATHS = [
  'src/lib/platform',
  'src/components/PlatformLoginForm.tsx',
  'src/options/PlatformAccountPanel.tsx',
  'src/background/externalAuth.ts',
  'src/lib/quota/adapters/platform.ts',
  'docs/PLATFORM_OPERATIONS.zh.md',
  'docs/deploy-platform.zh.md',
  'services',
  'website',
];

/** 不复制到公开仓的 workflow */
export const BYOK_EXCLUDE_WORKFLOWS = new Set([
  'api.yml',
  'website.yml',
  'publish-chrome-store.yml',
]);

/** 公开仓 package.json 移除的 scripts */
export const BYOK_STRIP_SCRIPTS = ['website:sync-images', 'website:readme-images'];

export const OPEN_REPO_HOMEPAGE = 'https://github.com/xiaotao-02/prompt-hub';
export const OPEN_REPO_RAW_PRIVACY = `${OPEN_REPO_HOMEPAGE}/blob/main/PRIVACY.md`;
