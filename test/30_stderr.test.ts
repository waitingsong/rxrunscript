/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  delay,
  finalize,
  map,
  mergeMap,
  reduce,
  tap,
  timeout,
} from 'rxjs/operators'

import { run, RxRunFnArgs, RxSpawnOpts } from '../src/index'
import { initialRxRunOpts } from '../src/lib/config'
import { bindStderrData } from '../src/lib/stderr'
import {
  basename,
  join,
} from '../src/shared/index'

import { fakeCmds, needle, opensslCmds } from './helper'


const filename = basename(__filename)


describe(filename, () => {

  it('Should ignore stderr with negative maxStderrBuffer', done => {
    const stderrMaxBufferSize = -1
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.stderrMaxBufferSize = stderrMaxBufferSize
        return assertWithStderrOutput(cmd, args, options)
      }),
    )

    ret$
      .pipe(
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
        return assertWithStderrOutput(cmd, args, options)
      }),
    )

    ret$
      .pipe(
        finalize(() => done()),
      )
      .subscribe()

  })


  it('Should ignore stderr with maxStderrBuffer default value(200) and exit code 0', done => {
    const ret$ = ofrom(opensslCmds).pipe(
      concatMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        return assertWithStderrOutput(cmd, args, options)
      }),
    )

    ret$
      .pipe(
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
      const skipUntilNotifier$ = of(void 0)
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, NEVER, skipUntilNotifier$, stderrMaxBufferSize)
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
      const skipUntilNotifier$ = of(void 0)
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, NEVER, skipUntilNotifier$, stderrMaxBufferSize)
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
      const skipUntilNotifier$ = of(void 0)
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, NEVER, skipUntilNotifier$, stderrMaxBufferSize)
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


describe(filename, () => {

  describe('Should bindStderrData() works with takeUntilNotifier', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should no output with takeUntilNotifier emit never', done => {
      const takeUntilNotifier$ = NEVER
      const skipUntilNotifier$ = of(null).pipe()
      const ret$ = ofrom(fakeCmds).pipe(
      // const ret$ = of(fakeCmds[0]).pipe(
        mergeMap(([cmd, args]) => {
          return assertNoStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
            2000,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should no output with takeUntilNotifier emit immediately', done => {
      const takeUntilNotifier$ = of('foo', 'bar')
      const skipUntilNotifier$ = of(void 0)
      const ret$ = ofrom(fakeCmds).pipe(
        mergeMap(([cmd, args]) => {
          return assertNoStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
            2000,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should output with takeUntilNotifier emit dalay', done => {
      const takeUntilNotifier$ = of('foo', 'bar').pipe(delay(2000))
      const skipUntilNotifier$ = of(void 0)
      const ret$ = ofrom(fakeCmds).pipe(
        mergeMap(([cmd, args]) => {
          return assertWithStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

  })
})


describe(filename, () => {

  describe('Should bindStderrData() works with skipUntilNotifier', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should no output with skipUntilNotifier emit never', done => {
      const takeUntilNotifier$ = of(null).pipe(delay(2000))
      const skipUntilNotifier$ = NEVER
      const ret$ = ofrom(fakeCmds).pipe(
        mergeMap(([cmd, args]) => {
          return assertNoStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should output with skipUntilNotifier emit immediately', done => {
      const takeUntilNotifier$ = of(null).pipe(delay(2000))
      const skipUntilNotifier$ = of(void 0)
      const ret$ = ofrom(fakeCmds).pipe(
        mergeMap(([cmd, args]) => {
          return assertWithStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should output with skipUntilNotifier emit dalay before takeUntilNotifier', done => {
      const takeUntilNotifier$ = of('foo', 'bar').pipe(delay(2000))
      const skipUntilNotifier$ = of(void 0).pipe(delay(1000))
      const ret$ = ofrom(fakeCmds).pipe(
      // const ret$ = of(fakeCmds[0]).pipe(
        mergeMap(([cmd, args]) => {
          return assertWithStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should output with skipUntilNotifier emit dalay after takeUntilNotifier', done => {
      const takeUntilNotifier$ = of('foo', 'bar').pipe(delay(2000))
      const skipUntilNotifier$ = of(void 0).pipe(delay(3000))
      const ret$ = ofrom(fakeCmds).pipe(
        mergeMap(([cmd, args]) => {
          return assertWithStderrOutputBindStderrData(
            cmd,
            args,
            spawnOpts,
            takeUntilNotifier$,
            skipUntilNotifier$,
          )
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })


  })
})



function assertNoStderrOutputBindStderrData(
  cmd: RxRunFnArgs[0],
  args: RxRunFnArgs[1],
  spawnOpts: RxRunFnArgs[2],
  takeUntilNotifier$: Observable<any>,
  skipUntilNotifier$: Observable<any>,
  timeoutVal: number = 5000,
) {

  const proc = spawn(cmd, args ? args : [], spawnOpts ? spawnOpts : {})
  return bindStderrData(proc.stderr, takeUntilNotifier$, skipUntilNotifier$, 200).pipe(
    tap(buf => {
      assert(false, 'Should not emit data' + buf.toString())
    }),
    timeout(timeoutVal),
    catchError((err: Error) => {
      assert(err && err.name === 'TimeoutError', err.message)
      return of(void 0)
    }),
  )
}


function assertWithStderrOutputBindStderrData(
  cmd: RxRunFnArgs[0],
  args: RxRunFnArgs[1],
  spawnOpts: RxRunFnArgs[2],
  takeUntilNotifier$: Observable<any>,
  skipUntilNotifier$: Observable<any>,
) {
  const proc = spawn(cmd, args ? args : [], spawnOpts ? spawnOpts : {})
  return bindStderrData(proc.stderr, takeUntilNotifier$, skipUntilNotifier$, 200).pipe(
    tap(buf => {
      assert(buf && buf.byteLength > 0, 'Should emit data, but byteLength zero')
    }),
    timeout(15000),
  )
}


function assertNoStderrOutput(
  obb$: Observable<Buffer>,
): Observable<Buffer> {

  const random = Math.random().toString()
  const ret$ = obb$.pipe(
    tap(buf => {
      assert(false, 'Should not output from stderr. But got:' + buf.toString())
    }),
    timeout(3000),
    catchError(() => of(Buffer.from(random))),
    tap(buf => {
      assert(buf.toString() === random, 'Should got error thrown by timeout()')
    }),
  )
  return ret$
}


function assertWithStderrOutput(
  cmd: RxRunFnArgs[0],
  args?: RxRunFnArgs[1] | null,
  opts?: RxRunFnArgs[2] | null,
) {

  return run(cmd, args, opts).pipe(
    reduce((acc: Buffer[], curr: Buffer) => {
      acc.push(curr)
      return acc
    }, []),
    map(arr => Buffer.concat(arr)),
    tap(buf => {
      const ret = buf.toString()
      assert(ret.indexOf(needle) === 0, `Got result: "${ret}"`)
    }),
  )
}
