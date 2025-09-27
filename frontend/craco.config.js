const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util'),
        url: require.resolve('url'),
        assert: require.resolve('assert'),
        vm: require.resolve('vm-browserify'),
        process: require.resolve('process/browser.js'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        fs: false,
        net: false,
        tls: false,
      };

      // Add plugins to provide polyfills
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js',
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
      ];

      // Ignore source map warnings for node_modules
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ];

      // Fix module resolution issues
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@react-native-async-storage/async-storage': require.resolve('./src/mocks/asyncStorageMock.js'),
        'process/browser': require.resolve('process/browser.js'),
        'process/browser.js': require.resolve('process/browser.js'),
      };

      // Handle ES modules and fix fullly specified imports
      webpackConfig.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.jsx', '.tsx'],
        '.mjs': ['.mjs', '.js'],
      };

      // Fix for modern ES modules
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });

      // Handle source map loader issues
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.loader && rule.loader.includes('source-map-loader')) {
          rule.exclude = /node_modules/;
        }
      });

      return webpackConfig;
    },
  },
};
