import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import { from as ofrom } from 'rxjs'
import {
  defaultIfEmpty,
  mergeMap,
  timeout,
} from 'rxjs/operators'

import { OutputRow, run, RxRunFnArgs } from '../src/index.js'


describe(fileShortPath(import.meta.url), () => {
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
          defaultIfEmpty({
            data: Buffer.from('Should empty value'),
          }),
          timeout(30000),
        )
      }),
    )
      .subscribe({
        next: (row: OutputRow) => {
          if (typeof row.exitCode === 'undefined' && Buffer.isBuffer(row.data)) {
            assert(! row.data.byteLength, 'Should result empty, but got: ' + row.data.toString())
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

