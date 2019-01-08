/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  finalize,
  mergeMap,
  tap,
} from 'rxjs/operators'

import { initialMsgPrefixOpts, run, RxRunFnArgs, RxSpawnOpts } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'

import { assetRunError, opensslCmds } from './helper'


const filename = basename(__filename)


describe(filename, () => {

  it('Should runSpawn() throw Error', done => {
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

    ret$
      .pipe(
        finalize(() => done()),
      )
      .subscribe()
  })


})
