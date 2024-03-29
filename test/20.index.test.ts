import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import { from as ofrom, of } from 'rxjs'
import {
  catchError,
  finalize,
  mergeMap,
  tap,
} from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index.js'


describe(fileShortPath(import.meta.url), () => {
  it('Should work running openssl', (done) => {
    const cmds: RxRunFnArgs[] = [
      ['openssl version'],
      ['openssl  version'],
      ['openssl', ['version'] ],
      ['openssl ', [' version'] ],
    ]

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
        next: (val) => {
          try {
            console.info('running:', val)
            if (Buffer.isBuffer(val)) {
              const ret = val.toString()
              assert(ret && ret.includes('OpenSSL'), `result: "${ret}"`)
            }
          }
          catch (ex) {
            assert(false, (ex as Error).message)
          }
        },
        error: (ex) => {
          assert(false, (ex as Error).message)
          done()
        },
        complete: () => done(),
      })

  })

  it('Should work running openssl with invalid args', (done) => {
    const cmds: RxRunFnArgs[] = [
      ['openssl fake'],
      ['openssl ', ['fake'] ],
    ]
    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts)
      }, 1),
    )
      .subscribe({
        next: (val) => {
          try {
            if (Buffer.isBuffer(val)) {
              const ret = val.toString()
              assert(! ret.includes('OpenSSL'), `should got error but got result: "${ret}"`)
            }
          }
          catch (ex) {
            assert(true)
          }
        },
        error: () => {
          assert(true)
          done()
        },
        complete: () => done(),
      })
  })

  it('Should throw error with unknown command', (done) => {
    const cmds: RxRunFnArgs[] = [
      ['fakefoo'],
      ['fakefoo ', ['fake'] ],
      // ['openssl version'],
      // opensslCmds[0],
    ]
    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap((val) => {
            if (Buffer.isBuffer(val)) {
              assert(false, 'Should not got data from stdout' + val.toString())
            }
          }),
          catchError(() => {
            return of(Buffer.from(''))
          }),
        )
      }, 1),
      finalize(() => {
        done()
      }),
    ).subscribe()
  })


})

