/// <reference types="mocha" />

import * as assert from 'power-assert'
import { from as ofrom, of } from 'rxjs'
import { catchError, concatMap, defaultIfEmpty, finalize, mergeMap, tap } from 'rxjs/operators'

import { initialMsgPrefixOpts, run } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'

import { assertOnOpensslStderr, needle, opensslCmds } from './helper'


const filename = basename(__filename)
const { stderrPrefix } = initialMsgPrefixOpts


describe(filename, () => {

  it('Should ignore stderr with negative maxStderrBuffer: -1', done => {
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

  it('Should got result with maxStderrBuffer: 10000', done => {
    const maxErrBuf = 10000

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
        (err: Error) => {
          assert(false, err.message)
        },
        done,
      )
  })

})
