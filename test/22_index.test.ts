import { error } from 'console'
import { sep } from 'path'

import {
  basename,
  join,
} from '@waiting/shared-core'
import { concat, from as ofrom, of, EMPTY } from 'rxjs'
import {
  catchError,
  concatMap,
  defaultIfEmpty,
  filter,
  finalize,
  mergeMap,
  tap,
  timeout,
} from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index'

import { opensslCmds, testIntervalSource } from './helper'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)


describe(filename, () => {
  const file = 'prepare.cmd'
  const appDirName = __dirname.split(sep).slice(-2, -1)[0]

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

      [`../${appDirName}/test/${file}`, [Math.random().toString()] ],
      [join('..', appDirName, 'test', file), [Math.random().toString()] ],
    ]
    const ret$ = ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap((buf) => {
            const ret = buf.toString().trim()
            assert(ret && ret.includes(file))
            if (args && args[0]) {
              assert(ret.includes(args[0]))
            }
          }),
        )
      }),
      finalize(() => done()),
    )

    ret$.subscribe()
  })
})

