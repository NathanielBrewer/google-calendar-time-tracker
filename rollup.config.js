import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import strip from '@rollup/plugin-strip';
import del from "rollup-plugin-delete";
import inject from '@rollup/plugin-inject';
import path from 'path';
import fs from 'fs';

const environment = process.env.NODE_ENV || 'dev';
console.log('[rollup.config.js] environment:', environment);
const isProduction = (environment == 'prod');

const compiledEntry = path.resolve('.tmp', 'code.js');
if (!fs.existsSync(compiledEntry)) {
  throw new Error('Missing compiled entry at .tmp/code.js. Run "npm run compile" before bundling.');
}

export default {
  input: compiledEntry,
  output: {
    dir: `dist/${environment}`,
    format: 'cjs',
    sourcemap: false,
    name: 'global',
    extend: true,
    entryFileNames: '[name].gs',
  },
  treeshake: false,
  plugins: [
    // Inject files imported into multiple files here so individual imports do not cause collisons and get renamed by Rollup 
    // Example: { NameForInjectedClass: path.resolve('src/ExampleClassToInject.js'), }
    // Uncomment `inject()` to use it. It will error if you don't provide it with a valid param
    // inject(),
    // Delete anything currently in the dist folder
    del({ targets: `dist/${environment}` }),
    resolve({
      extensions: ['.mjs', '.js', '.json', '.node']
    }),
    commonjs(),
    // Add files here that you don't want rollup to touch, like JSON or HTML
    copy({
      targets: [
        { src: 'appsscript.json', dest: `dist/${environment}` },
        { src: '.clasp.json', dest: `dist/${environment}` },
        {
          src: 'src/index.html',
          dest: `dist/${environment}`,
          transform: (contents) => {
            const jspdfPath = path.resolve('node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js');
            const svg2pdfPath = path.resolve('node_modules', 'svg2pdf.js', 'dist', 'svg2pdf.umd.min.js');
            const jspdfSource = fs.readFileSync(jspdfPath, 'utf8');
            const svg2pdfSource = fs.readFileSync(svg2pdfPath, 'utf8');
            const ubuntuRegularPath = path.resolve('assets', 'fonts', 'Ubuntu-R.ttf');
            const ubuntuBoldPath = path.resolve('assets', 'fonts', 'Ubuntu-B.ttf');
            const ubuntuRegularBase64 = fs.readFileSync(ubuntuRegularPath).toString('base64');
            const ubuntuBoldBase64 = fs.readFileSync(ubuntuBoldPath).toString('base64');
            return contents
              .toString()
              .replace('<!-- INLINE_JSPDF -->', `<script>${jspdfSource}</script>`)
              .replace('<!-- INLINE_SVG2PDF -->', `<script>${svg2pdfSource}</script>`)
              .replace('INLINE_FONT_UBUNTU_REGULAR', ubuntuRegularBase64)
              .replace('INLINE_FONT_UBUNTU_BOLD', ubuntuBoldBase64);
          }
        },
        {
          src: 'src/invoice-builder/pageWithTotals.svg',
          dest: `dist/${environment}/invoice-builder`,
          rename: 'pageWithTotals.html',
          transform: (contents) => contents
        },
        {
          src: 'src/invoice-builder/pageWithoutTotals.svg',
          dest: `dist/${environment}/invoice-builder`,
          rename: 'pageWithoutTotals.html',
          transform: (contents) => contents
        },
      ],
      globOptions: {
        dot: true,
      }
    }),
    isProduction && strip({
      functions: ['console.log'],
    })
  ],
  onwarn(warning, warn) {
    if (warning.code === 'EMPTY_BUNDLE') {
      console.error(`No output will be generated because the bundle is empty: ${warning.message}`);
    } else {
      warn(warning);
    }
  }
};
