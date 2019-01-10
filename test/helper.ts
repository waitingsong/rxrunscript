import { SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, Observable } from 'rxjs'
import { catchError, concatMap, defaultIfEmpty, filter, finalize, map, mergeMap, reduce, tap } from 'rxjs/operators'

import { run, MsgPrefixOpts, RxRunFnArgs } from '../src/index'



export const fakeCmds: RxRunFnArgs[] = [
  ['openssl fake'],
  ['openssl ', ['fake'] ],
  ['fakecommand'],
]


export const needle = '-----BEGIN ENCRYPTED PRIVATE KEY-----'

const openssl = 'openssl'
const genpkey = 'genpkey'
const genArgs = '-algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048'
export const opensslCmds: RxRunFnArgs[] = [
  [`${openssl} ${genpkey} ${genArgs}`, null],
  [`${openssl} ${genpkey} ${genArgs}`, null, {} ],
  [`${openssl} ${genpkey} ${genArgs}`, [] ],
  [`${openssl} ${genpkey} ${genArgs}`, [''] ],
  [`${openssl} ${genpkey} ${genArgs}`],

  [`${openssl} ${genpkey}`, [genArgs] ],
  [`${openssl} ${genpkey}`, [genArgs, ''] ],
  [`${openssl} ${genpkey}`, [genArgs] ],

  [openssl, [`${genpkey} ${genArgs}`] ],
  [openssl, [`${genpkey} ${genArgs}`], {} ],
  [openssl, [`${genpkey} ${genArgs}`] ],

  [openssl, [`${genpkey} ${genArgs}`, ''] ],
  [openssl, ['', `${genpkey} ${genArgs}`, ''] ],
  [openssl, [' ', `${genpkey} ${genArgs}`, ' '] ],

  [openssl, [genpkey, genArgs] ],
  [openssl, [genpkey, genArgs], {} ],
  [openssl, [genpkey, genArgs] ],
  [openssl, [genpkey, ' ', genArgs] ],
  [openssl, [genpkey, ' ', genArgs, ' '] ],
]


export function assetRunError(err: Error, errPrefix: MsgPrefixOpts['errPrefix']) {
  const msg = err ? err.message : ''
  if (msg) {
    if (errPrefix.length) {
      assert(msg.indexOf(errPrefix) === 0, msg)
    }
    else {
      console.info('assetRunErr() value of errPrefix is blank. Can not do assert')
    }
  }
  else {
    assert(false, 'Catched Error without err.message')
  }
}


export function assertOnOpensslStderr(err: Error, stderrPrefix: MsgPrefixOpts['stderrPrefix']) {
  const msg = err ? err.message : ''
  if (msg) {
    if (stderrPrefix.length) {
      const msg1 = msg.slice(0, stderrPrefix.length)
      const msg2 = msg.slice(stderrPrefix.length)
      assert(msg1 === stderrPrefix, msg)

      const arr = msg2.split(/\r\n|\n|\r/)
      assert(arr.length >= 1)
      const stderr = arr.length >= 1 ? arr[1] : ''
      assert(stderr === '.' || /^\.+/.test(stderr) === true, msg)
    }
    else {
      const arr = msg.split(/\r\n|\n|\r/)
      assert(arr.length >= 1)
      const stderr = arr.length > 1 ? arr[1] : ''
      assert(stderr === '.' || /^\.+/.test(stderr) === true, msg)
    }
  }
  else {
    assert(false, 'Catched Error without err.message')
  }
}

export function assertStderr(err: Error, stderrPrefix: MsgPrefixOpts['stderrPrefix']) {
  const msg = err ? err.message : ''
  if (msg) {
    if (stderrPrefix.length) {
      const msg1 = msg.slice(0, stderrPrefix.length)
      assert(msg1 === stderrPrefix, msg)
    }
    else {
      const arr = msg.split(/\r\n|\n|\r/)
      assert(arr.length >= 1)
      console.info('assertStderr() stderrPrefix value blank. Can not assert')
    }
  }
  else {
    assert(false, 'Catched Error without err.message')
  }
}


export function testStderrPrefixWithExitError(
  cmdArr: RxRunFnArgs[],
  stderrPrefix: string,
  done: () => void,
): void {

  ofrom(cmdArr).pipe(
    concatMap(([cmd, args, opts]) => {
      return run(cmd, args, opts).pipe(
        tap(buf => {
          assert(false, 'Should not got stdout data:' + buf.toString())
        }),
        catchError((err: Error) => {
          assertStderr(err, stderrPrefix)
          return of(Buffer.from('catched'))
        }),
      )
    }),
    finalize(() => done()),
  ).subscribe()
}


export function testOpensslStderrPrefixWithExitError(
  cmdArr: RxRunFnArgs[],
  stderrPrefix: string,
  done: () => void,
): void {

  ofrom(cmdArr).pipe(
    concatMap(([cmd, args, opts]) => {
      return run(cmd, args, opts).pipe(
        tap(buf => {
          assert(false, 'Should not got stdout data:' + buf.toString())
        }),
        catchError((err: Error) => {
          assertOnOpensslStderr(err, stderrPrefix)
          return of(Buffer.from('catched'))
        }),
      )
    }),
    finalize(() => done()),
  ).subscribe()
}

export function testIntervalSource(
  cmd: RxRunFnArgs[0],
  args: RxRunFnArgs[1],
  opts: RxRunFnArgs[2],
  count: number,
): Observable<string[]> {

  return run(cmd, args, opts).pipe(
    map(buf => buf.toString()),
    tap(ret => {
      console.log('got:', ret.trim())
    }),
    concatMap(ret => {
      const arr = ret.split(/\s+/)
      // console.log('arr:', arr)
      return ofrom(arr).pipe(
        filter(val => val && val.trim().length > 0 ? true : false),
        // tap(val => console.log('output:', val)),
      )
    }),
    reduce((acc: string[], curr: string) => {
      acc.push(curr)
      return acc
    }, []),
    tap(arr => {
      assert(arr.length === count, `should got array with ${count} items but got: ${arr.length}`)
    }),
  )
}

export function assertOpensslWithStderrOutput(
  cmd: RxRunFnArgs[0],
  args?: RxRunFnArgs[1] | null,
  opts?: RxRunFnArgs[2] | null,
) {

  return run(cmd, args, opts).pipe(
    reduce((acc: Buffer[], curr: Buffer) => {
      acc.push(curr)
      return acc
    }, []),
    map(arr => Buffer.concat(arr)),
    tap(buf => {
      const ret = buf.toString()
      assert(ret.indexOf(needle) === 0, `Got result: "${ret}"`)
    }),
  )
}
