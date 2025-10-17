const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const mobileNodeModules = path.join(projectRoot, 'node_modules');
const workspaceNodeModules = path.join(workspaceRoot, 'node_modules');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(projectRoot);

config.watchFolders ??= [];
if (!config.watchFolders.includes(workspaceRoot)) {
  config.watchFolders.push(workspaceRoot);
}

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.join(mobileNodeModules, 'react'),
  'react-dom': path.join(mobileNodeModules, 'react-dom')
};

config.resolver.nodeModulesPaths = [mobileNodeModules, workspaceNodeModules];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@expo/metro-config': path.join(workspaceNodeModules, '@expo/metro-config')
};

module.exports = config;
