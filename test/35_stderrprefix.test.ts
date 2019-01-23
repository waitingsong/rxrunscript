/// <reference types="mocha" />


import {
  basename,
  join,
} from '@waiting/shared-core'

import { initialMsgPrefixOpts } from '../src/lib/config'

import { fakeCmds, testStderrPrefixWithExitError } from './helper'


const filename = basename(__filename)
const { stderrPrefix: stderrPrefixOri } = initialMsgPrefixOpts


describe(filename, () => {
  after(() => {
    initialMsgPrefixOpts.stderrPrefix = stderrPrefixOri
  })

  describe('Should stderrPrefix works', () => {

    it('with blank value', done => {
      const stderrPrefix = ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('with random value', done => {
      const stderrPrefix = Math.random() + ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('with random value (lf)', done => {
      const stderrPrefix = Math.random() + '\n\n\n\n'
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('with bank value', done => {
      const stderrPrefix = ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('works with random value', done => {
      const stderrPrefix = Math.random() + ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('works with random value (lf)', done => {
      const stderrPrefix = Math.random() + '\n'
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

  })
})
