/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [],
  options: {
    doNotFollow: {
      path: [
        'node_modules',
        '\\.test\\.(ts|tsx)$',
        'dev/preview',
        'scripts',
        'website',
        'services',
      ],
    },
    exclude: {
      path: [
        'node_modules',
        '\\.test\\.(ts|tsx)$',
        'dev/preview',
        'scripts',
        'website',
        'services',
      ],
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
  },
};
