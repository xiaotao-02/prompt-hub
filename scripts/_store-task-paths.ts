import { join } from 'node:path';

/** task.out 以 docs/ 开头则相对仓库根，否则相对 store-assets/ */
export function resolveTaskOutAbs(task, rootDir) {
  if (task.out.startsWith('docs/')) return join(rootDir, task.out);
  return join(rootDir, 'store-assets', task.out);
}
