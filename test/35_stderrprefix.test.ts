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

const { stderrPrefix: stderrPrefixOri } = initialMsgPrefixOpts
const cmd = 'openssl genpkey -algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048 '
const needle = '-----BEGIN ENCRYPTED PRIVATE KEY-----'

describe(filename, () => {
  after(() => {
    initialMsgPrefixOpts.stderrPrefix = stderrPrefixOri
  })

  it('Should stderrPrefix works with blank value and maxStderrBuffer: 0', done => {
    const stderrPrefix = ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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

  it('Should stderrPrefix works with random value and maxStderrBuffer: 0', done => {
    const stderrPrefix = Math.random() + ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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

  it('Should stderrPrefix works with random value (lf) and maxStderrBuffer: 0', done => {
    const stderrPrefix = Math.random() + '\n\n\n\n'
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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


  it('Should stderrPrefix works with bank value and maxStderrBuffer: 1', done => {
    const stderrPrefix = ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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

  it('Should stderrPrefix works with random value and maxStderrBuffer: 1', done => {
    const stderrPrefix = Math.random() + ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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

  it('Should stderrPrefix works with random value (lf) and maxStderrBuffer: 1', done => {
    const stderrPrefix = Math.random() + '\n'
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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


  it('Should stderrPrefix works with blank value and maxStderrBuffer: 10000', done => {
    const stderrPrefix = ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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

  it('Should stderrPrefix works with random value and maxStderrBuffer: 10000', done => {
    const stderrPrefix = Math.random() + ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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

  it('Should stderrPrefix works with random value (lf) and maxStderrBuffer: 10000', done => {
    const stderrPrefix = Math.random() + '\n'
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix
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
