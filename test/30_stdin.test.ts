/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { defer, from as ofrom, merge, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  delay,
  finalize,
  map,
  mergeMap,
  reduce,
  tap,
  timeout,
} from 'rxjs/operators'

import { run, RxRunFnArgs, RxSpawnOpts } from '../src/index'
import { initialRxRunOpts } from '../src/lib/config'
import { bindStderrData } from '../src/lib/stderr'
import { bindStdinData } from '../src/lib/stdin'
import { bindStdoutData } from '../src/lib/stdout'
import {
  basename,
  join,
} from '../src/shared/index'

import {
  assertOpensslWithStderrOutput,
  fakeCmds,
  opensslCmds,
} from './helper'


const filename = basename(__filename)


describe.only(filename, () => {

  describe('Should stdin works', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }
    const caOpts = {
      kind: 'ca',
      centerName: 'default',
      alg: 'rsa',
      days: 10950,  // 30years
      pass: 'mycapass',
      keyBits: 2048,  // for speed
      ecParamgenCurve: 'P-256',
      hash: 'sha256',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      O: '',
      C: 'CN',
      ST: '',
      L: '',
      emailAddress: '',
    }



    it('Should ', done => {
      const pass = 'foobar'
      const keyBits = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        tap(key => {
          console.log(key)
        }),
        mergeMap(pkey => genPubKeyFromPrivateKey(pkey, pass, 'rsa', spawnOpts)),
        tap(key => {
          console.log(key)
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })


  })
})


function genRSAKey(pass: string, keyBits: number): Observable<string> {
  const args = [
    'genpkey', '-algorithm', 'rsa',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `rsa_keygen_bits:${keyBits}`,
  ]

  /* istanbul ignore next */
  return runOpenssl(args).pipe(
    tap(stdout => {
      if (!stdout || !stdout.includes('PRIVATE KEY')) {
        throw new Error(`generate private key failed. stdout: "${stdout}"`)
      }
    }),
  )
}


function genPubKeyFromPrivateKey(
  privateKey: string,
  passwd: PrivateKeyOpts['pass'],
  alg: PrivateKeyOpts['alg'],
  spawnOpts: SpawnOptions,
): Observable<string> {

  const cmd = 'openssl'
  const args = [alg, '-pubout']
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }

  const proc = spawn(cmd, args, spawnOpts)
  const takeUntilNotifier$ = of('foo').pipe(delay(60000))
  const input$ = of(privateKey, passwd).pipe(
    delay(3000),
    tap(val => {
      console.log(val)
    }),
  )

  const out$ = bindStdoutData(proc.stdout, NEVER).pipe(
    map(buf => buf.toString()),
    tap(ret => {
      console.log('ret---------------:', ret)
      if (! ret || ! ret.includes('PUBLIC KEY')) {
        throw new Error('no PUBKEY')
      }
    }),
  )

  const stderr$ = bindStderrData(proc.stderr, NEVER, of(null), 2000).pipe(
    map(buf => buf.toString()),
    tap(err => {
      console.log(err)
    }),
  )

  const never$ = bindStdinData(proc.stdin, takeUntilNotifier$, input$)

  const ret$ = merge(out$, never$, stderr$)

  return ret$
}

export interface PrivateKeyOpts {
  // serial: string
  centerName: 'default' | string
  alg: 'rsa' | 'ec'
  pass: string
  keyBits: number // for alg==rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
}

export function runOpenssl(args: string[], options?: Partial<RxSpawnOpts>): Observable<string> {
  const script = 'openssl'
  const ret$ = run(script, args, options)

  return ret$
    .pipe(
      reduce((acc: Buffer[], curr: Buffer) => {
        acc.push(curr)
        return acc
      }, []),
      map(arr => Buffer.concat(arr)),
      map(buf => buf.toString()),
    )
}
