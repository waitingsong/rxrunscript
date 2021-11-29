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

  describe('Should stderrPrefix work', () => {

    it('with blank value', (done) => {
      const stderrPrefix = ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('with random value', (done) => {
      const stderrPrefix = Math.random().toString()
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('with random value (lf)', (done) => {
      const stderrPrefix = Math.random().toString() + '\n\n\n\n'
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('with bank value', (done) => {
      const stderrPrefix = ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('work with random value', (done) => {
      const stderrPrefix = Math.random().toString() + ''
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

    it('work with random value (lf)', (done) => {
      const stderrPrefix = Math.random().toString() + '\n'
      initialMsgPrefixOpts.stderrPrefix = stderrPrefix

      testStderrPrefixWithExitError(fakeCmds, stderrPrefix, done)
    })

  })
})
