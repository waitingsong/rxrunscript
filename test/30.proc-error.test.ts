import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import { from as ofrom, of } from 'rxjs'
import {
  catchError,
  finalize,
  mergeMap,
  tap,
} from 'rxjs/operators'

import { run, RxSpawnOpts } from '../src/index.js'
import { initialMsgPrefixOpts } from '../src/lib/config.js'

import { assetRunError, opensslCmds } from './helper.js'


describe(fileShortPath(import.meta.url), () => {

  it('Should runSpawn() throw Error', (done) => {
    const gid = 123456789
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.gid = gid

        return run(cmd, args, opts).pipe(
          tap((val) => {
            if (Buffer.isBuffer(val)) {
              console.warn(val.toString())
              assert(false, 'Should error thrown, but got data')
            }
            else if (val.exitCode === 0) {
              assert(false, 'Should error thrown, but got exitCode: ' + val.exitCode.toString())
            }
          }),
          catchError((err: Error) => {
            assetRunError(err, initialMsgPrefixOpts.errPrefix)
            return of('')
          }),
        )
      }),
    )

    ret$.pipe(finalize(() => done())).subscribe()
  })

})
