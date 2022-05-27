import assert from 'node:assert/strict'
import { sep, join } from 'path'

import { fileShortPath, genCurrentDirname } from '@waiting/shared-core'
import { from as ofrom } from 'rxjs'
import {
  finalize,
  mergeMap,
  tap,
} from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index.js'


const __dirname = genCurrentDirname(import.meta.url)

describe(fileShortPath(import.meta.url), () => {
  const file = 'prepare.cmd'
  const appDirName = join(__dirname, '..')

  if (process.platform !== 'win32') {
    console.info('skip test under non-win32')
    return
  }

  it(`Should running "${file}" work`, (done) => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')
    if (! appDirName) {
      assert(false)
      return
    }

    const cmds: RxRunFnArgs[] = [
      [`./test/${file} ${Math.random().toString()} `],

      [`./test/${file}`, [Math.random().toString()] ],
      [`./test/${file}`, [Math.random().toString(), '--'] ],
      [join('./test', file), [Math.random().toString()] ],
      [join('./test', file), [Math.random().toString(), '--'] ],

      [`${appDirName}/test/${file}`, [Math.random().toString()] ],
      [join(appDirName, 'test', file), [Math.random().toString()] ],
    ]

    cmds.forEach((value) => {
      console.log('value:', value)
    })

    const ret$ = ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap((val) => {
            if (Buffer.isBuffer(val)) {
              const ret = val.toString().trim()
              assert(ret && ret.includes(file))
              if (args && args[0]) {
                assert(ret.includes(args[0]))
              }
            }
          }),
        )
      }),
      finalize(() => done()),
    )

    ret$.subscribe()
  })
})

