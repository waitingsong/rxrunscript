import assert from 'assert/strict'
import { relative } from 'path'

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

import { ExitCodeSignal, run, RxRunFnArgs } from '../src/index'


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {
  it('Should work without any output', (done) => {
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
        next: (val: Buffer | ExitCodeSignal) => {
          if (Buffer.isBuffer(val)) {
            assert(! val.byteLength, 'Should result empty, but got: ' + val.toString())
          }
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

