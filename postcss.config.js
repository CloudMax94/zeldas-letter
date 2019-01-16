module.exports = {
  parser: 'postcss-scss',
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-extend'),
    require('autoprefixer'),
    require('cssnano')({zindex: false})
  ]
}
