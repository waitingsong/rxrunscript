import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import { from as ofrom, of } from 'rxjs'
import { finalize, map, mergeMap, tap } from 'rxjs/operators'

import { ProcessOpts } from '../src/index.js'
import { initialMsgPrefixOpts, initialRxRunOpts } from '../src/lib/config.js'
import { processOpts } from '../src/lib/prepare.js'

import { assetRunError } from './helper.js'


describe(fileShortPath(import.meta.url), () => {
  describe('Should processOpts() work', () => {

    it('blank command', (done) => {
      const cmds: string[] = [
        '',
        ' ',
        '\u{3000}\t\v ',
      ]

      ofrom(cmds).pipe(
        mergeMap((cmd) => {
          const opts: ProcessOpts = {
            command: cmd,
            initialRxRunOpts,
          }
          return of(opts)
        }),
        map((opts) => {
          try {
            const rxrunOpts = processOpts(opts)
            assert(false, 'Should throw error, but not')
          }
          catch (ex) {
            assetRunError(ex as Error, initialMsgPrefixOpts.errPrefix)
            return Buffer.from('')
          }
        }),
        finalize(() => done()),
      ).subscribe()
    })

    it('command length exceed 1000', (done) => {
      const random = Math.random().toString()

      ofrom([random.repeat(100)]).pipe(
        mergeMap((cmd) => {
          const opts: ProcessOpts = {
            command: cmd,
            initialRxRunOpts,
            spawnOpts: {
              maxCmdLength: 1000,
            },
          }
          return of(opts)
        }),
        map((opts) => {
          try {
            const rxrunOpts = processOpts(opts)
            assert(false, 'Should throw error, but not')
          }
          catch (ex) {
            assetRunError(ex as Error, initialMsgPrefixOpts.errPrefix)
            return Buffer.from('')
          }
        }),
        finalize(() => done()),
      ).subscribe()
    })

  })
})

