const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');

const buildOptions = {
  entryPoints: ['code.tsx'],
  bundle: true,
  outfile: 'code.js',
  target: 'es6',
  jsxFactory: 'figma.widget.h',
  jsxFragment: 'figma.widget.Fragment',
  define: {
    __html__: JSON.stringify(html),
  },
  logLevel: 'info',
};

if (isWatch) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('Watching for changes…');
  });
} else {
  esbuild.build(buildOptions).then(() => console.log('Build complete.'));
}
