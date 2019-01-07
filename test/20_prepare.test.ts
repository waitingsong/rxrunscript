/// <reference types="mocha" />

import { SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, EMPTY } from 'rxjs'
import { catchError, concatMap, filter, finalize, map, max, mergeMap, reduce, tap } from 'rxjs/operators'

import { initialMsgPrefixOpts, run, RxRunFnArgs } from '../src/index'
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
      const cmds: RxRunFnArgs[] = [
        [''],
        [' '],
        ['\u{3000}\t\v '],
      ]

      ofrom(cmds).pipe(
        map(([cmd, args, opts]) => {
          try {
            processOpts(cmd, args, opts)
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
