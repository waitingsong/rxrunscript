/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of } from 'rxjs'
import { catchError, concatMap, defaultIfEmpty, finalize, mergeMap, reduce, take, tap, timeout } from 'rxjs/operators'

import { initialMsgPrefixOpts, run } from '../src/index'
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
    const maxErrBuf = -1

    ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts, maxErrBuf)
      }),
    )
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            assert(ret.indexOf(needle) === 0, `result: "${ret}"`)
          }
          catch (ex) {
            assert(false, ex)
          }
        },
        err => {
          assert(false, err)
          done()
        },
        done,
    )
  })

  it('Should ignore stderr with maxStderrBuffer: 0', done => {
    const maxErrBuf = 0

    ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts, maxErrBuf).pipe(
          tap(buf => {
            const ret = buf.toString()
            assert(ret.indexOf(needle) === 0, `Got result: "${ret}"`)
          }),
          catchError((err: Error) => {
            assert(false, err.message)
            return of(Buffer.from('catched'))
          }),
        )
      }),
      finalize(() => done()),
    ).subscribe()
  })


  it('Should got only stderr with maxStderrBuffer: 1', done => {
    const maxErrBuf = 1

    // outpu stderr first during generate key
    ofrom(opensslCmds).pipe(
      concatMap(([cmd, args, opts]) => {
        return run(cmd, args, opts, maxErrBuf).pipe(
          defaultIfEmpty(Buffer.from('Should got Error but not')),
          tap(buf => {
            assert(false, buf.toString())
          }),
          catchError((err: Error) => {
            assertOnOpensslStderr(err, stderrPrefix)
            return of(Buffer.from('catched'))
          }),
        )
      }),
      finalize(() => done()),
    ).subscribe()
  })

  it('Should got result from stdout with maxStderrBuffer: 10000', done => {
    const maxErrBuf = 10000
    const ret$ = ofrom(opensslCmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts, maxErrBuf)
      }),
    )

    ret$.pipe(
      reduce((acc: Buffer[], curr: Buffer) => {
        acc.push(curr)
        return acc
      }, []),
      tap(arr => {
        const ret = Buffer.concat(arr).toString()
        assert(ret.indexOf(needle) === 0, `stdout result: "${ret}"`)
      }),
      finalize(() => done()),
    ).subscribe()
  })

})


describe(filename, () => {

  describe('Should got bindStderrData() works', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('with bufMaxSize: 0', done => {
      const maxErrBuf = 0
      const random = Math.random().toString()
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, maxErrBuf)
        }),
      )

      ret$
        .pipe(
          tap(() => {
            assert(false, 'Should not output from stderr')
          }),
          timeout(3000),
          catchError(() => of(Buffer.from(random))),
          tap(buf => {
            assert(buf.toString() === random, 'Should got error thrown by timeout()')
          }),
          finalize(() => done()),
        )
        .subscribe()
    })

    it('with bufMaxSize: 1', done => {
      const maxErrBuf = 1
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, maxErrBuf)
        }),
      )

      ret$
        .pipe(
          timeout(3000),
          finalize(() => done()),
        )
        .subscribe()
    })

    it('with bufMaxSize: 10000', done => {
      const maxErrBuf = 10000
      const random = Math.random().toString()
      const ret$ = ofrom(opensslCmds).pipe(
        mergeMap(([cmd, args]) => {
          const proc = spawn(cmd, args ? args : [], spawnOpts)
          return bindStderrData(proc.stderr, maxErrBuf)
        }),
      )

      ret$
        .pipe(
          tap(() => {
            assert(false, 'Should not output from stderr')
          }),
          timeout(3000),
          catchError(() => of(Buffer.from(random))),
          tap(buf => {
            assert(buf.toString() === random, 'Should got error thrown by timeout()')
          }),
          finalize(() => done()),
        )
        .subscribe()
    })

  })
})
