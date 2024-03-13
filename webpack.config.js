const path = require('path');
const config = require('./gulp/config');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

function createConfig (env, entry, output) {
  if (env === undefined) {
    env = process.env.NODE_ENV;
  }

  const isProduction = env === 'production';

  const configPublic = require(`./config/config.${env.toLowerCase()}.js`);
  const defineConstants = {
    ENVIRONMENT: JSON.stringify(env.toUpperCase()),
    PRODUCTION: isProduction
  };

  for (const key in configPublic) {
    defineConstants[key] = configPublic[key];
  }

  const webpackConfig = {
    mode: env,
    context: path.join(__dirname, config.src.js),
    devtool: isProduction ? false : 'inline-source-map',
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        analyzerPort: 4000,
        openAnalyzer: false
      }),
      new webpack.DefinePlugin(defineConstants)
    ],
    resolve: {
      extensions: ['.js', '.ts', '.json'],
      alias: {
        config: path.resolve(__dirname, 'dev/js/config.ts'),
        utility: path.resolve(__dirname, 'dev/js/utility/'),
        functions: path.resolve(__dirname, 'dev/js/functions'),
        components: path.resolve(__dirname, 'dev/templates/components/'),
        js: path.resolve(__dirname, 'dev/templates/js/')
      }
    },
    module: {
      rules: [{
        test: /\.(js|jsx|tsx|ts)$/,
        loader: 'babel-loader',
        exclude: [
          path.resolve(__dirname, 'node_modules')
        ]
      }]
    },
    optimization: {
      runtimeChunk: 'single' // нужно использовать в случае использования нескольких зависимых точек входа на одной странице
    }
  };

  // временный костыль
  // if (entry) {
  //   webpackConfig.entry = {};
  //   webpackConfig.entry = entry;
  // }

  // if (output) {
  //   webpackConfig.output = {};
  //   webpackConfig.output = output;
  // }
  webpackConfig.entry = {
    main: path.resolve(__dirname, 'dev/js/main.ts'),
    comments: {
      import: path.resolve(__dirname, 'dev/js/comments.ts'),
      dependOn: 'main'
    },
    ladder: {
      import: path.resolve(__dirname, 'dev/js/ladder.ts'),
      dependOn: 'main'
    },
    personal: {
      import: path.resolve(__dirname, 'dev/js/personal.ts'),
      dependOn: 'main'
    },
    step: {
      import: path.resolve(__dirname, 'dev/js/step'),
      dependOn: 'main'
    },
    chat: {
      import: path.resolve(__dirname, 'dev/js/chat'),
      dependOn: 'main'
    }
  };
  webpackConfig.output = {
    filename: 'bundle.[name].js'
  };

  if (isProduction) {
    webpackConfig.optimization.minimize = true;
  }

  return webpackConfig;
}

module.exports = createConfig();
module.exports.createConfig = createConfig;
