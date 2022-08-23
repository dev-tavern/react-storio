import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import del from 'rollup-plugin-delete'
import dts from 'rollup-plugin-dts'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

/*
@rollup/plugin-typescript currently downgraded to v8.3.3 due to:
https://github.com/rollup/plugins/issues/1230
*/

const banner = `/*!
 * react-storio v${pkg.version}
 * Copyright (c) ${new Date().getFullYear()} Josh Gamble
 * @license MIT
 */`

const peerDeps = Object.keys(pkg.peerDependencies || {})
console.log(`Peer dependencies will be configured as external:\n${peerDeps}`)

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        banner,
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        banner,
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    external: peerDeps,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      terser(),
    ],
  },
  {
    input: 'dist/esm/dts/index.d.ts',
    output: [
      {
        banner,
        file: 'dist/index.d.ts',
        format: 'esm',
      },
    ],
    plugins: [
      dts(),
      del({
        hook: 'buildEnd',
        targets: ['./dist/cjs/dts', './dist/esm/dts'],
      }),
    ],
  },
]
