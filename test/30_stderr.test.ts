/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, NEVER, Observable } from 'rxjs'
import {
  bufferTime,
  catchError,
  concatMap,
  finalize,
  mergeMap,
  tap,
  timeout,
} from 'rxjs/operators'

import { initialMsgPrefixOpts, run } from '../src/index'
import { initialRxRunOpts } from '../src/lib/config'
import { bindStderrData } from '../src/lib/stderr'
import {
  basename,
  join,
} from '../src/shared/index'

import { assertOnOpensslStderr, needle, opensslCmds } from './helper'


const filename = basename(__filename)
const { stderrPrefix } = initialMsgPrefixOpts


describe(filename, () => {

  it('Should ignore stderr with negative maxStderrBuffer', done => {
    const stderrMaxBufferSize = -1
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        if (opts) {
          opts.stderrMaxBufferSize = stderrMaxBufferSize
        }
        else {
          opts = { stderrMaxBufferSize }
        }
        return run(cmd, args, opts)
      }),
    )

    ret$
      .pipe(
        bufferTime(1000),
        tap(buf => {
          const ret = buf.toString()
          assert(ret.indexOf(needle) === 0, `Got result: "${ret}"`)
        }),
        finalize(() => done()),
      )
      .subscribe()
  })

  it('Should ignore stderr with maxStderrBuffer: 0', done => {
    const stderrMaxBufferSize = 0
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        if (opts) {
          opts.stderrMaxBufferSize = stderrMaxBufferSize
        }
        else {
          opts = { stderrMaxBufferSize }
        }
        return run(cmd, args, opts).pipe()
      }),
    )

    ret$
      .pipe(
        bufferTime(1000),
        tap(buf => {
          const ret = buf.toString()
          assert(ret.indexOf(needle) === 0, `Got result: "${ret}"`)
        }),
        finalize(() => done()),
      )
      .subscribe()

  })


  it('Should ignore stderr with maxStderrBuffer default value(200) and exit code 0', done => {
    const ret$ = ofrom(opensslCmds).pipe(
      concatMap(([cmd, args, opts]) => {
        return run(cmd, args, opts)
      }),
    )

    ret$
      .pipe(
        bufferTime(1000),
        tap(buf => {
          const ret = buf.toString()
          assert(ret.indexOf(needle) === 0, `Got result: "${ret}"`)
        }),
        finalize(() => done()),
      )
      .subscribe()

  })

})


describe(filename, () => {

  describe('Should got bindStderrData() works', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should ignore stderr with nagetive bufMaxSize', done => {
      const stderrMaxBufferSize = -1
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, stderrMaxBufferSize, NEVER)
        }),
      )

      ret$
        .pipe(
          assertNoStderrOutput,
          finalize(() => done()),
        )
        .subscribe()
    })

    it('Should ignore stderr with bufMaxSize: 0', done => {
      const stderrMaxBufferSize = 0
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, stderrMaxBufferSize, NEVER)
        }),
      )

      ret$
        .pipe(
          assertNoStderrOutput,
          finalize(() => done()),
        )
        .subscribe()
    })

    it('Should not stderr output with default bufMaxSize', done => {
      const stderrMaxBufferSize = initialRxRunOpts.stderrMaxBufferSize
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, stderrMaxBufferSize, NEVER)
        }),
      )

      ret$
        .pipe(
          assertNoStderrOutput,
          finalize(() => done()),
        )
        .subscribe()
    })

  })
})


function assertNoStderrOutput(
  obb$: Observable<Buffer>,
): Observable<Buffer> {

  const random = Math.random().toString()
  const ret$ = obb$.pipe(
    tap(() => {
      assert(false, 'Should not output from stderr')
    }),
    timeout(3000),
    catchError(() => of(Buffer.from(random))),
    tap(buf => {
      assert(buf.toString() === random, 'Should got error thrown by timeout()')
    }),
  )
  return ret$
}
