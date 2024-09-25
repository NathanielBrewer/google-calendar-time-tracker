import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import strip from '@rollup/plugin-strip';
import del from "rollup-plugin-delete";
import inject from '@rollup/plugin-inject';

const environment = process.env.NODE_ENV || 'dev'; 
console.log('[rollup.config.js] environment:', environment);
const isProduction = (environment == 'prod');

export default {
  input: 'src/code.js',
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
    // Use inject so individual imports do not cause collisons and get renamed by Rollup 
    inject(),
    del({ targets: 'dist/*' }),
    resolve(),
    commonjs(),
    // Use copy for files that you want to copy into the dist/<target> folder, such as HTML files
    copy(),
    isProduction && strip({
      // Remove console.log in production
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
