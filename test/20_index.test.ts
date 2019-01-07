/// <reference types="mocha" />

import { SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, EMPTY } from 'rxjs'
import { catchError, concatMap, filter, finalize, map, max, mergeMap, reduce, tap } from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'

import { testIntervalSource } from './helper'


const filename = basename(__filename)


describe(filename, () => {
  it('Should works running openssl', done => {
    const cmds: RxRunFnArgs[] = [
      ['openssl version'],
      ['openssl  version'],
      ['openssl', ['version'] ],
      ['openssl ', [' version'] ],
    ]

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts, maxErrBuf]) => {
        return run(cmd, args, opts, maxErrBuf)
      }),
    )
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            assert(ret.includes('OpenSSL'), `result: "${ret}"`)
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

  it('Should works running openssl with invalid args', done => {
    const cmds: RxRunFnArgs[] = [
      ['openssl fake'],
      ['openssl ', ['fake'] ],
    ]
    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts, maxErrBuf]) => {
        return run(cmd, args, opts, maxErrBuf)
      }),
    )
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            assert(!ret.includes('OpenSSL'), `should got error but got result: "${ret}"`)
          }
          catch (ex) {
            assert(true)
          }
        },
        err => {
          assert(true)
          done()
        },
        done,
    )
  })


})


describe(filename, () => {
  const file = join(__dirname, 'interval-source.ts')

  it('Should works running interval-source.ts with random count serially', done => {
    let count = Math.floor(Math.random() * 10)
    const options = {
      cwd: __dirname, // ! for test/tsconfig.json
    }

    if (count < 3) {
      count = 3
    }

    const cmds: RxRunFnArgs[] = [
      [`ts-node ${file} ${count}`, null, options],
      [' ts-node ', [`${file} ${count}`], options],
      ['ts-node ', [file, count.toString()], options],
    ]
    console.info('start test count serially:', count)

    ofrom(cmds).pipe(
      concatMap(([cmd, args, opts, maxErrBuf]) => testIntervalSource(cmd, args, opts, maxErrBuf, count)),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })

  it('Should works running interval-source.ts with random count parallelly', done => {
    let count = Math.floor(Math.random() * 10)
    const options = {
      cwd: __dirname, // ! for test/tsconfig.json
    }

    if (count < 3) {
      count = 3
    }

    const cmds: RxRunFnArgs[] = [
      [`ts-node ${file} ${count}`, null, options],
      [' ts-node ', [`${file} ${count} `], options],
      ['ts-node ', [file, count.toString()], options],
    ]
    console.info('start test count parallelly:', count)

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts, maxErrBuf]) => testIntervalSource(cmd, args, opts, maxErrBuf, count)),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })


})
