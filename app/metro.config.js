// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// monorepo support — watch the root node_modules
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// stubs for packages without native modules on certain platforms
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // track-player native module excluded from android (incompatible with TurboModules in RN 0.83)
  if (moduleName === 'react-native-track-player' && platform !== 'ios') {
    return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'web-stubs/react-native-track-player.js') };
  }
  if (platform === 'web') {
    const stubs = {
      '@solana-mobile/mobile-wallet-adapter-protocol-web3js': path.resolve(projectRoot, 'web-stubs/solana-mobile.js'),
      '@solana-mobile/mobile-wallet-adapter-protocol': path.resolve(projectRoot, 'web-stubs/solana-mobile.js'),
      '@react-three/fiber/native': path.resolve(projectRoot, 'web-stubs/react-three-fiber-native.js'),
    };
    if (stubs[moduleName]) {
      return { type: 'sourceFile', filePath: stubs[moduleName] };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
