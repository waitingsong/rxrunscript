/// <reference types="mocha" />


import { initialMsgPrefixOpts, RxRunFnArgs } from '../src/index'
import {
  basename,
  join,
} from '../src/shared/index'

import { opensslCmds, testStderrPrefix } from './helper'


const filename = basename(__filename)
const { stderrPrefix: stderrPrefixOri } = initialMsgPrefixOpts


describe(filename, () => {
  after(() => {
    initialMsgPrefixOpts.stderrPrefix = stderrPrefixOri
  })

  it('Should stderrPrefix works with blank value and maxStderrBuffer: 1', done => {
    const maxErrBuf = 1
    const stderrPrefix = ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix

    testStderrPrefix(opensslCmds, maxErrBuf, stderrPrefix, done)
  })

  it('Should stderrPrefix works with random value and maxStderrBuffer: 1', done => {
    const maxErrBuf = 1
    const stderrPrefix = Math.random() + ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix

    testStderrPrefix(opensslCmds, maxErrBuf, stderrPrefix, done)
  })

  it('Should stderrPrefix works with random value (lf) and maxStderrBuffer: 1', done => {
    const maxErrBuf = 1
    const stderrPrefix = Math.random() + '\n\n\n\n'
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix

    testStderrPrefix(opensslCmds, maxErrBuf, stderrPrefix, done)
  })


  it('Should stderrPrefix works with bank value and maxStderrBuffer: 1', done => {
    const maxErrBuf = 1
    const stderrPrefix = ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix

    testStderrPrefix(opensslCmds, maxErrBuf, stderrPrefix, done)
  })

  it('Should stderrPrefix works with random value and maxStderrBuffer: 1', done => {
    const maxErrBuf = 1
    const stderrPrefix = Math.random() + ''
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix

    testStderrPrefix(opensslCmds, maxErrBuf, stderrPrefix, done)
  })

  it('Should stderrPrefix works with random value (lf) and maxStderrBuffer: 1', done => {
    const maxErrBuf = 1
    const stderrPrefix = Math.random() + '\n'
    initialMsgPrefixOpts.stderrPrefix = stderrPrefix

    testStderrPrefix(opensslCmds, maxErrBuf, stderrPrefix, done)
  })

})
