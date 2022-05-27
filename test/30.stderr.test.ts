import assert from 'node:assert/strict'
import { spawn, SpawnOptions } from 'node:child_process'

import { fileShortPath } from '@waiting/shared-core'
import { from as ofrom, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  delay,
  finalize,
  mergeMap,
  tap,
  timeout,
} from 'rxjs/operators'

import { OutputRow, RxRunFnArgs, RxSpawnOpts } from '../src/index.js'
import { initialRxRunOpts } from '../src/lib/config.js'
import { bindStderrData } from '../src/lib/stderr.js'

import {
  assertOpensslWithStderrOutput,
  fakeCmds,
  opensslCmds,
} from './helper.js'


describe(fileShortPath(import.meta.url), () => {

  it('Should ignore stderr with maxStderrBuffer: 0', (done) => {
    const stderrMaxBufferSize = 0
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.stderrMaxBufferSize = stderrMaxBufferSize
        return assertOpensslWithStderrOutput(cmd, args, options)
      }),
    )

    ret$.pipe(finalize(() => done())).subscribe()
  })

  it('Should no stderr output with maxStderrBuffer default value(200) and exit code 0', (done) => {
    const ret$ = ofrom(opensslCmds).pipe(
      concatMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        return assertOpensslWithStderrOutput(cmd, args, options)
      }),
    )

    ret$.pipe(finalize(() => done())).subscribe()
  })

  it('Should no stderr output with negative maxStderrBuffer (will use default value)', (done) => {
    const stderrMaxBufferSize = -1
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, options]) => {
        const opts: Partial<RxSpawnOpts> = { ...options }
        opts.stderrMaxBufferSize = stderrMaxBufferSize
        return assertOpensslWithStderrOutput(cmd, args, options)
      }),
    )

    ret$.pipe(finalize(() => done())).subscribe()
  })


})


describe(fileShortPath(import.meta.url), () => {

  describe('Should bindStderrData() work', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should ignore stderr with bufMaxSize: 0', (done) => {
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

    it('Should no stderr output with default bufMaxSize', (done) => {
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

    it('Should no stderr output with nagetive bufMaxSize (use default value)', (done) => {
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


  })
})


describe(fileShortPath(import.meta.url), () => {

  describe('Should bindStderrData() work with takeUntilNotifier', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should no output with takeUntilNotifier emit never', (done) => {
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

    it('Should no output with takeUntilNotifier emit immediately', (done) => {
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

    it('Should output with takeUntilNotifier emit dalay', (done) => {
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


describe(fileShortPath(import.meta.url), () => {

  describe('Should bindStderrData() work with skipUntilNotifier', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should no output with skipUntilNotifier emit never', (done) => {
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

    it('Should output with skipUntilNotifier emit immediately', (done) => {
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

    it('Should output with skipUntilNotifier emit dalay before takeUntilNotifier', (done) => {
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

    it('Should output with skipUntilNotifier emit dalay after takeUntilNotifier', (done) => {
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
  timeoutVal = 30000,
) {

  const proc = spawn(cmd, args ? args : [], spawnOpts ? spawnOpts : {})
  return bindStderrData(proc.stderr, takeUntilNotifier$, skipUntilNotifier$, 200).pipe(
    tap((row) => {
      assert(false, 'Should not emit data' + row.data.toString())
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
    tap((row) => {
      assert(row && row.data && row.data.byteLength > 0, 'Should emit data, but byteLength zero')
    }),
    timeout(25000),
  )
}


function assertNoStderrOutput(
  obb$: Observable<OutputRow>,
): Observable<OutputRow> {

  const random = Math.random().toString()
  const ret$ = obb$.pipe(
    tap((row) => {
      assert(false, 'Should not output from stderr. But got:' + row.data.toString())
    }),
    timeout(10000),
    catchError(() => {
      return of({
        data: Buffer.from(random),
      } as OutputRow)
    }),
    tap((row) => {
      assert(row.data.toString() === random, 'Should got error thrown by timeout()')
    }),
  )
  return ret$
}

