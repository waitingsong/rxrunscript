/// <reference types="mocha" />

import { SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, EMPTY } from 'rxjs'
import { catchError, concatMap, filter, finalize, map, max, mergeMap, reduce, tap } from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'

import { opensslCmds, testIntervalSource } from './helper'


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
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts)
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
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts)
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

  it.skip('Should throw error with unknown command', done => {
    const cmds: RxRunFnArgs[] = [
      ['fakefoo'],
      ['fakefoo ', ['fake'] ],
      ['openssl version'],
      // opensslCmds[0],
    ]
    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          catchError((err: Error) => {
            console.log(err)
            return of(Buffer.from(''))
          }),
        )
      }),
      tap(buf => {
        console.log(buf.toString())
      }),
      finalize(() => {
        done()
      }),
    ).subscribe()
  })


})


describe(filename, () => {
  const file = join(__dirname, 'interval-source.ts')
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

  it('Should works running interval-source.ts with random count serially', done => {
    console.info('start test count serially:', count)

    ofrom(cmds).pipe(
      concatMap(([cmd, args, opts]) => testIntervalSource(cmd, args, opts, count)),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })

  it('Should works running interval-source.ts with random count parallelly', done => {
    console.info('start test count parallelly:', count)

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => testIntervalSource(cmd, args, opts, count)),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })


})
