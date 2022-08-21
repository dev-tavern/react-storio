import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import pkg from './package.json'

const banner = `/*!
 * react-storio v${pkg.version}
 * Copyright (c) ${new Date().getFullYear()} Josh Gamble
 * @license MIT
 */`

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [resolve(), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  },
  {
    input: 'dist/esm/types/index.d.ts',
    output: [{ banner, file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
]
