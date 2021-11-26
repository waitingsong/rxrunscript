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
  it('Should works without any output', (done) => {
    const cmds: RxRunFnArgs[] = [
      ['cd /'],
      ['cd ..'],
      ['cd', ['/'] ],
      ['cd', ['..'] ],
    ]

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          defaultIfEmpty(Buffer.from('Should empty value')),
          timeout(5000),
        )
      }),
    )
      .subscribe({
        next: (buf: Buffer) => {
          assert(! buf.byteLength, 'Should result empty, but got: ' + buf.toString())
        },
        error: (err) => {
          assert(false, (err as Error).message)
          done()
        },
        complete: () => {
          done()
        },
      })

  })
})

