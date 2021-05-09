/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'

import {
  basename,
  join,
} from '@waiting/shared-core'
import * as assert from 'power-assert'
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


const filename = basename(__filename)


describe(filename, () => {

  it('Should runSpawn() throw Error', (done) => {
    const gid = 123456789
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.gid = gid

        return run(cmd, args, opts).pipe(
          tap(() => {
            assert(false, 'Should not got stdout')
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
