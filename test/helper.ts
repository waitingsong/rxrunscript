import { SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { from as ofrom, of, Observable } from 'rxjs'
import { catchError, concatMap, defaultIfEmpty, filter, finalize, map, mergeMap, reduce, tap } from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index'


export const needle = '-----BEGIN ENCRYPTED PRIVATE KEY-----'

const openssl = 'openssl'
const genpkey = 'genpkey'
const genArgs = '-algorithm rsa -aes256 -pass pass:mycapass -pkeyopt rsa_keygen_bits:2048'
export const opensslCmds: RxRunFnArgs[] = [
  [`${openssl} ${genpkey} ${genArgs}`, null, null],
  [`${openssl} ${genpkey} ${genArgs}`, null, {} ],
  [`${openssl} ${genpkey} ${genArgs}`, [], null],
  [`${openssl} ${genpkey} ${genArgs}`, [''], null],
  [`${openssl} ${genpkey} ${genArgs}`],

  [`${openssl} ${genpkey}`, [genArgs], null],
  [`${openssl} ${genpkey}`, [genArgs, ''], null],
  [`${openssl} ${genpkey}`, [genArgs] ],

  [openssl, [`${genpkey} ${genArgs}`], null],
  [openssl, [`${genpkey} ${genArgs}`], {} ],
  [openssl, [`${genpkey} ${genArgs}`] ],

  [openssl, [`${genpkey} ${genArgs}`, ''] ],
  [openssl, ['', `${genpkey} ${genArgs}`, ''] ],
  [openssl, [' ', `${genpkey} ${genArgs}`, ' '] ],

  [openssl, [genpkey, genArgs], null],
  [openssl, [genpkey, genArgs], {} ],
  [openssl, [genpkey, genArgs] ],
  [openssl, [genpkey, ' ', genArgs] ],
  [openssl, [genpkey, ' ', genArgs, ' '] ],
]


export function assertOnOpensslStderr(err: Error, stderrPrefix: string) {
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
    assert(false, err.message)
  }
}


export function testStderrPrefix(
  cmdArr: RxRunFnArgs[],
  maxErrBuf: number,
  stderrPrefix: string,
  done: () => void,
): void {

  ofrom(cmdArr).pipe(
    concatMap(([cmd, args, opts]) => {
      return run(cmd, args, opts, maxErrBuf).pipe(
        defaultIfEmpty(Buffer.from('Should got Error but not')),
        tap(buf => {
          assert(false, buf.toString())
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
  maxErrBuf: RxRunFnArgs[3],
  count: number,
): Observable<string[]> {

  return run(cmd, args, opts, maxErrBuf).pipe(
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
