/// <reference types="mocha" />

import * as assert from 'power-assert'
import { reduce, tap } from 'rxjs/operators'

import { run } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'


const filename = basename(__filename)

describe(filename, () => {

  it('Should ignore stderr with maxStderrBuffer: -1  ', done => {
    const cmd = 'openssl genpkey -algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048 '
    run(cmd, {}, -1)
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            const needle = '-----BEGIN ENCRYPTED PRIVATE KEY-----'
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

  it('Should got stderr immediately with maxStderrBuffer: 0', done => {
    const cmd = 'openssl genpkey -algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048 '
    run(cmd, {}, 0)
      .subscribe(
        () => {
          assert(false, 'Should not got next()')
          done()
        },
        (err: Error) => {
          const msg = err ? err.message : ''
          if (msg) {
            const arr = msg.split('\n')
            const stderr = arr.length > 1 ? arr[1] : ''
            assert(stderr === '.' || /\.+/.test(stderr) === true, msg)
          }
          else {
            assert(false, err.message)
          }
          done()
        },
        done,
    )
  })


  it('Should got result with maxStderrBuffer: 100', done => {
    const cmd = 'openssl genpkey -algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048 '
    run(cmd, {}, 100)
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            const needle = '-----BEGIN ENCRYPTED PRIVATE KEY-----'
            assert(ret.indexOf(needle) === 0, `result: "${ret}"`)
          }
          catch (ex) {
            assert(false, ex)
          }
        },
        err => {
          assert(false, err)
        },
        done,
      )
  })

})
