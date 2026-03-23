/**
 * Babel configuration for Jest.
 *
 * The inline plugin replaces every `import.meta.env` access with an empty
 * object literal `({})` so that Vite-specific env variables resolve to
 * `undefined` and fall back to their default values during tests.  This
 * allows modules that use `import.meta.env.*` to be imported safely inside
 * a CommonJS/Jest environment without runtime syntax errors.
 */
function replaceImportMetaEnvPlugin() {
  return {
    name: 'replace-import-meta-env',
    visitor: {
      MemberExpression(path) {
        const { object, property } = path.node;
        if (
          object.type === 'MetaProperty' &&
          object.meta.name === 'import' &&
          object.property.name === 'meta' &&
          property.name === 'env'
        ) {
          // Replace `import.meta.env` with `({})` so that any `.VITE_*`
          // property access returns undefined and `|| fallback` kicks in.
          path.replaceWithSourceString('({})');
        }
      }
    }
  };
}

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [replaceImportMetaEnvPlugin]
};
