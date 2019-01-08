/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  finalize,
  map,
  mergeMap,
  reduce,
  tap,
  timeout,
} from 'rxjs/operators'

import { run, RxSpawnOpts } from '../src/index'
import { initialRxRunOpts } from '../src/lib/config'
import { bindStderrData } from '../src/lib/stderr'
import {
  basename,
  join,
} from '../src/shared/index'

import { assertOnOpensslStderr, needle, opensslCmds } from './helper'


const filename = basename(__filename)


describe(filename, () => {

  it('Should ignore stderr with negative maxStderrBuffer', done => {
    const stderrMaxBufferSize = -1
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.stderrMaxBufferSize = stderrMaxBufferSize

        return run(cmd, args, opts).pipe(
          reduce((acc: Buffer[], curr: Buffer) => {
            acc.push(curr)
            return acc
          }, []),
          map(arr => Buffer.concat(arr)),
        )
      }),
    )

    ret$
      .pipe(
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
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.stderrMaxBufferSize = stderrMaxBufferSize

        return run(cmd, args, opts).pipe(
          reduce((acc: Buffer[], curr: Buffer) => {
            acc.push(curr)
            return acc
          }, []),
          map(arr => Buffer.concat(arr)),
        )
      }),
    )

    ret$
      .pipe(
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
      concatMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }

        return run(cmd, args, opts).pipe(
          reduce((acc: Buffer[], curr: Buffer) => {
            acc.push(curr)
            return acc
          }, []),
          map(arr => Buffer.concat(arr)),
        )
      }),
    )

    ret$
      .pipe(
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
