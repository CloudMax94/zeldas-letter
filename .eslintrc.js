const path = require('path')

module.exports = {
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "module",
    "allowImportExportEverywhere": true
  },
  "extends": [
    "standard",
    "standard-jsx"
  ],
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    "compat/compat": "error",
    // "consistent-return": "off",
    "import/no-unresolved": "error",
    // "import/no-extraneous-dependencies": "off",
    "react/sort-comp": ["error", {
      "order": ["type-annotations", "static-methods", "lifecycle", "everything-else", "render"]
    }]
  },
  "plugins": [
    "import",
    "promise",
    "compat",
    "react"
  ],
  "settings": {
    "import/resolver": {
      node: {
        paths: [
          'node_modules'
        ],
      },
      "webpack": {
        "config": path.join(__dirname, "webpack.config.eslint")
      }
    }
  }
}
