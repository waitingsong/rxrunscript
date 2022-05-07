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

import { run, RxRunFnArgs } from '../src/index'


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

