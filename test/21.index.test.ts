import assert from 'node:assert/strict'

import { fileShortPath, genCurrentDirname, join } from '@waiting/shared-core'
import { from as ofrom, of, EMPTY } from 'rxjs'
import {
  catchError,
  concatMap,
  finalize,
  mergeMap,
} from 'rxjs/operators'

import { RxRunFnArgs } from '../src/index.js'

import { testIntervalSource } from './helper.js'


const __dirname = genCurrentDirname(import.meta.url)

describe(fileShortPath(import.meta.url), () => {
  const file = join(__dirname, 'interval-source.ts')
  const tsConfig = join(__dirname, 'tsconfig.json')
  let count = Math.floor(Math.random() * 10)
  const options = {
    cwd: __dirname, // ! for test/tsconfig.json
  }

  if (count < 3) {
    count = 3
  }
  const cmds: RxRunFnArgs[] = [
    [`ts-node-esm -P "${tsConfig}" ${file} --count ${count}`, null, options],
    [' ts-node-esm ', [` -P "${tsConfig}" ${file} --count ${count}`], options],
    ['ts-node-esm ', [`-P "${tsConfig}"`, file, ' --count', count.toString()], options],
  ]

  it('Should work running interval-source.ts with random count serially', (done) => {
    // if (process.platform === 'win32') {
    //   console.info('skip test under win32')
    //   return done()
    // }
    console.info('start test count serially:', count)

    ofrom(cmds).pipe(
      concatMap(([cmd, args, options2]) => {
        const opts = { ...options2 }
        if (process.platform === 'win32') {
          opts.cwd = 'c:/Program Files/Git/mingw64/bin'
        }
        return testIntervalSource(cmd, args, opts, count)
      }),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })

  it('Should work running interval-source.ts with random count parallelly', (done) => {
    if (process.platform === 'win32') {
      console.info('skip test under win32')
      return done()
    }
    console.info('start test count parallelly:', count)

    ofrom(cmds).pipe(
      // mergeMap(([cmd, args, opts]) => testIntervalSource(cmd, args, opts, count)),
      mergeMap(([cmd, args, options2]) => {
        const opts = { ...options2 }
        if (process.platform === 'win32') {
          opts.cwd = 'c:/Program Files/Git/mingw64/bin'
        }
        return testIntervalSource(cmd, args, opts, count)
      }),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })

})

