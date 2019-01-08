/// <reference types="mocha" />

import { SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, EMPTY } from 'rxjs'
import { catchError, concatMap, filter, finalize, map, max, merge, mergeMap, reduce, tap } from 'rxjs/operators'

import { initialMsgPrefixOpts, run, ProcessOpts, RxRunFnArgs } from '../src/index'
import { initialRxRunOpts } from '../src/lib/config'
import { processOpts } from '../src/lib/prepare'
import {
  basename,
  join,
} from '../src/shared/index'

import { assetRunErr } from './helper'



const filename = basename(__filename)


describe(filename, () => {
  describe('Should processOpts() works', () => {

    it('blank command', done => {
      const cmds: string[] = [
        '',
        ' ',
        '\u{3000}\t\v ',
      ]

      ofrom(cmds).pipe(
        mergeMap(cmd => {
          const opts: ProcessOpts = {
            command: cmd,
            initialRxRunOpts,
          }
          return of(opts)
        }),
        map(opts => {
          try {
            const rxrunOpts = processOpts(opts)
            assert(false, 'Should throw error, but not')
          }
          catch (ex) {
            assetRunErr(ex, initialMsgPrefixOpts.errPrefix)
            return Buffer.from('')
          }
        }),
        finalize(() => done()),
      ).subscribe()
    })

    it('command length exceed 1000', done => {
      const random = Math.random() + ''

      ofrom([random.repeat(100)]).pipe(
        mergeMap(cmd => {
          const opts: ProcessOpts = {
            command: cmd,
            initialRxRunOpts,
          }
          return of(opts)
        }),
        map(opts => {
          try {
            const rxrunOpts = processOpts(opts)
            assert(false, 'Should throw error, but not')
          }
          catch (ex) {
            assetRunErr(ex, initialMsgPrefixOpts.errPrefix)
            return Buffer.from('')
          }
        }),
        finalize(() => done()),
      ).subscribe()
    })

  })
})
