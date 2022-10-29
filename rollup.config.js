import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';
import cleanup from 'rollup-plugin-cleanup';

const __SRV__ = process.env.ROLLUP_WATCH;
const __DEV__ = __SRV__ || process.env.ROLLUP_DEV;

if (__SRV__) console.log('ROLLUP_SRV...');
if (__DEV__) console.log('ROLLUP_DEV...');

const serveopts = {
  contentBase: ['./dist'],
  host: '0.0.0.0',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  nodeResolve({}),
  commonjs(),
  typescript(),
  json(),
  babel({
    exclude: 'node_modules/**',
    babelHelpers: 'bundled',
  }),
  cleanup({ comments: 'none' }),
  __SRV__ && serve(serveopts),
  !__DEV__ &&
    terser({
      mangle: {
        safari10: true,
      },
    }),
];

export default [
  {
    input: 'src/frame-card.ts',
    output: {
      dir: './dist',
      format: 'es',
      sourcemap: __DEV__ ? true : false,
    },
    plugins: [...plugins],
    watch: {
      exclude: 'node_modules/**',
    },
  },
];
