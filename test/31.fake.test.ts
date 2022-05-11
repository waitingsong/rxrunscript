import assert from 'assert/strict'
import { relative } from 'path'

import { from as ofrom } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index'


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {
  it('Should work running fake cmd', (done) => {
    const cmds: RxRunFnArgs[] = [ ['fakexxx '] ]

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts = { ...options }
        if (process.platform === 'win32') {
          opts.cwd = 'c:/Program Files/Git/mingw64/bin'
        }
        return run(cmd, args, opts)
      }, 1), // parallel may cause empty result!
    )
      .subscribe({
        next: (row) => {
          if (Buffer.isBuffer(row.data)) {
            throw new TypeError('Should not got stdout data:' + row.data.toString())
          }
          else if (typeof row.exitCode === 'number' && row.exitCode !== 0) {
            throw new TypeError('Should get exitCode zero but got data:' + row.exitCode.toString())
          }
        },
        error: (ex: Error) => {
          assert(ex.message.includes('fakexxx'), ex.message)
          done()
        },
        complete: () => done(),
      })

  })


})

