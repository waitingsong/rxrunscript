/// <reference types="mocha" />

import * as assert from 'power-assert'
import { reduce, tap } from 'rxjs/operators'

import { initialMsgPrefixOpts, run } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'

import { assertOnOpensslStderr } from './helper'


const filename = basename(__filename)
const { stderrPrefix } = initialMsgPrefixOpts
const cmd = 'openssl genpkey -algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048 '
const needle = '-----BEGIN ENCRYPTED PRIVATE KEY-----'

describe(filename, () => {

  it('Should ignore stderr with maxStderrBuffer: -1  ', done => {
    run(cmd, {}, -1)
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

  it('Should got stderr immediately with maxStderrBuffer: 0', done => {
    run(cmd, {}, 0)
      .subscribe(
        () => {
          assert(false, 'Should not got next()')
          done()
        },
        (err: Error) => {
          assertOnOpensslStderr(err, stderrPrefix)
          done()
        },
        done,
    )
  })


  it('Should got both result and stderr with maxStderrBuffer: 1', done => {
    run(cmd, {}, 1)
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
          assertOnOpensslStderr(err, stderrPrefix)
          done()
        },
        done,
      )
  })

  it('Should got result with maxStderrBuffer: 10000', done => {
    run(cmd, {}, 10000)
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
