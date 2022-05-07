import assert from 'assert/strict'
import { relative } from 'path'

import { from as ofrom, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  finalize,
  mergeMap,
  tap,
} from 'rxjs/operators'

import { run, RxSpawnOpts } from '../src/index'
import { initialMsgPrefixOpts } from '../src/lib/config'

import { assetRunError, opensslCmds } from './helper'


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {

  it('Should runSpawn() throw Error', (done) => {
    const gid = 123456789
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.gid = gid

        return run(cmd, args, opts).pipe(
          tap((buf) => {
            console.warn(buf.toString())
            assert(false, 'Should error thrown, but got data')
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
