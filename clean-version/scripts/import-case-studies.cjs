// One-time import: render the original site's project articles without changing its source.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const source = path.resolve(process.argv[2] || '../space-version');
const fromSource = Module.createRequire(path.join(source, 'package.json'));
const ts = fromSource('typescript');
const React = fromSource('react');
const { renderToStaticMarkup } = fromSource('react-dom/server');
const h = React.createElement;
const originalLoad = Module._load;
const components = {
  PaperLead: ({ children }) => h('div', { className: 'article-lead' }, children),
  PaperSection: ({ title, children }) => h('section', {}, h('h2', {}, title), children),
  PaperSubsection: ({ title, children }) => h('div', {}, h('h3', {}, title), children),
  PaperMetrics: ({ metrics }) => h('dl', { className: 'metrics' }, metrics.map(([value, label]) => h('div', { key: label }, h('dt', {}, value), h('dd', {}, label)))),
  ScreenshotPlaceholder: () => null,
  PaperCallout: ({ children }) => h('aside', { className: 'article-note' }, children),
  StatusList: ({ children }) => h('ul', {}, children),
  StatusItem: ({ children }) => h('li', {}, children),
  PaperTable: ({ children }) => h('div', { className: 'table-scroll' }, children),
  bodyCopy: '',
};
Module._load = function (request, parent, isMain) {
  if (request.endsWith('/paper/PaperElements')) return components;
  if (request.endsWith('/paper/SyntaxCodeBlock')) return { __esModule: true, default: ({ code, language, filename }) => h('figure', { className: 'code-block' }, h('figcaption', {}, filename || language), h('pre', {}, h('code', {}, code.trim()))) };
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions['.tsx'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  module._compile(result.outputText, filename);
};
for (const [name, slug] of [['RuneC', 'runec'], ['FightCavesRL', 'fight-caves'], ['ByteWorld', 'byte-world']]) {
  const component = require(path.join(source, 'components/projects', `${name}CaseStudy.tsx`)).default;
  const markup = renderToStaticMarkup(h(component)).replace(/ class="([^"]*)"/g, (_, classes) => ['article-lead', 'metrics', 'article-note', 'table-scroll', 'code-block'].includes(classes) ? ` class="${classes}"` : '');
  fs.writeFileSync(path.join(__dirname, '../content', `${slug}.html`), markup + '\n');
  console.log(`Imported ${slug}: ${markup.length} bytes`);
}
