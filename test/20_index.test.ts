/// <reference types="mocha" />

import * as assert from 'power-assert'
import { reduce, tap } from 'rxjs/operators'

import runScript from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'



const filename = basename(__filename)


describe(filename, () => {

  it('Should works running openssl', done => {
    runScript('openssl version')
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
    runScript('openssl fake')
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

  it('Should works running interval-source.ts with random count', done => {
    let count = Math.floor(Math.random() * 10)
    const options = {
      cwd: __dirname, // ! for test/tsconfig.json
    }

    if (count === 0) {
      count = 5
    }

    runScript(`ts-node ${file} ${count}`, options).pipe(
        tap(buf => console.log('got:', buf.toString().trim())),
        reduce((acc: Buffer[], curr: Buffer) => {
          acc.push(curr)
          return acc
        }, []),
    )
      .subscribe(
        arr => {
          try {
            assert(arr.length === count, `should got array with ${count} items but got: "${arr}"`)
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


})
