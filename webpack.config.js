var path = require('path')
var webpack = require('webpack')

var HtmlWebpackPlugin = require('html-webpack-plugin')
var FaviconsWebpackPlugin = require('favicons-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

var isProduction = process.argv.indexOf('-p') > -1

module.exports = {
  entry: [
    'babel-polyfill',
    path.resolve(__dirname, './src/scripts/main.js')
  ],
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: './',
    filename: 'mudora.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /global.css$/,
        use: ExtractTextPlugin.extract({
          use: [
            {loader: 'css-loader', options: {sourceMap: true}},
            {loader: 'postcss-loader', options: {sourceMap: true}}
          ],
          fallback: 'style-loader'
        })
      },
      {
        test: /^((?!global).)*\.css$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                sourceMap: true,
                importLoaders: 1,
                localIdentName: '[name]__[local]'
              }
            },
            {loader: 'postcss-loader', options: {sourceMap: true}}
          ]
        })
      },
      {
        test: /\.(png|svg)$/,
        loader: 'file-loader',
        query: {
          context: 'src',
          name: '[path][name].[ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css']
  },
  devtool: 'source-map',
  plugins: [
    new FaviconsWebpackPlugin({
      // Your source logo
      logo: './src/favicon/master.png',
      // The prefix for all image files (might be a folder or a name)
      prefix: 'img/favicon/',
      // Emit all stats of the generated icons
      emitStats: false,
      // Generate a cache file with control hashes and
      // don't rebuild the favicons until those hashes change
      persistentCache: true,
      // Inject the html into the html-webpack-plugin
      inject: true,
      // favicon background color (see https://github.com/haydenbleasel/favicons#usage)
      background: '#fff',
      // favicon app title (see https://github.com/haydenbleasel/favicons#usage)
      title: 'Zelda\'s Letter'
    }),
    new HtmlWebpackPlugin({
      inject: false,
      template: require('html-webpack-template'),
      title: 'Zelda\'s Letter',
      filename: 'index.html',
      hash: true,
      appMountId: 'react-container',
      appMountHtmlSnippet: '<noscript>Please enable JavaScript to use Zelda\'s Letter</noscript>',
      meta: [
        {
          name: 'description',
          content: 'View and edit ocarina of time dialogs'
        }
      ],
      mobile: true,
      lang: 'en-US',
      links: [
        'https://fonts.googleapis.com/css?family=Roboto:400,700'
      ]
    }),
    new ExtractTextPlugin({
      filename: 'mudora.css',
      allChunks: true
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
      }
    })
  ]
}
