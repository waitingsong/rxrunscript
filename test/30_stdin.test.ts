/// <reference types="mocha" />

import { spawn, SpawnOptions } from 'child_process'
import * as assert from 'power-assert'
import { defer, from as ofrom, merge, of, NEVER, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  delay,
  finalize,
  last,
  map,
  mergeMap,
  reduce,
  shareReplay,
  takeUntil,
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
  opensslCmds,
} from './helper'


const filename = basename(__filename)


describe(filename, () => {

  describe('Should bindStdinData() works', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should got pubkey', done => {
      const pass: string = Math.random().toString()
      // const pass: string = 'foobar'
      const keyBits: number = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap(pkey => genPubKeyFromPrivateKey(pkey, pass, 'rsa', spawnOpts)),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should got stderr with invalid passwd', done => {
      const pass: string = Math.random().toString()
      const keyBits: number = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap(pkey => genPubKeyFromPrivateKey(pkey, 'fakepasswd', 'rsa', spawnOpts)),
        tap(stderr => {
          if (stderr && stderr.includes('stderr')) {
            assert(stderr.includes('unable to load Private'), stderr)
          }
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })
  })


})


describe(filename, () => {

  describe('Should stdin works', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }

    it('Should got pubkey', done => {
      const pass: string = Math.random().toString()
      const keyBits: number = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap(pkey => runGenPubKeyFromPrivateKey(pkey, pass, 'rsa', spawnOpts)),
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
  passwd: string,
  alg: 'rsa' | 'ec',
  spawnOpts: SpawnOptions,
): Observable<string> {

  const cmd = 'openssl'
  const args = [alg, '-pubout']
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }
  // args.push('-in', '-')

  const proc = spawn(cmd, args, spawnOpts)
  const input$ = of(privateKey).pipe(
    shareReplay(),
  )
  const takeUntilNotifier$ = input$.pipe(
    last(),
    delay(3500),
  )

  const stdin$ = bindStdinData(proc.stdin, input$)
  const stdout$ = bindStdoutData(proc.stdout, takeUntilNotifier$).pipe(
    map(buf => buf.toString()),
    tap(pem => {
      if (! pem || ! pem.includes('PUBLIC KEY')) {
        throw new Error('not PUBKEY: ' + pem)
      }
    }),
  )
  const stderr$ = bindStderrData(proc.stderr, takeUntilNotifier$, of('output'), 200).pipe(
    map(buf => buf.toString()),
    map(str => {
      return `stderr: ${str}`
    }),
  )

  const ret$ = merge(
    stdin$,
    stdout$,
    stderr$,
  )

  return ret$
}


function runGenPubKeyFromPrivateKey(
  privateKey: string,
  passwd: string,
  alg: 'rsa' | 'ec',
  spawnOpts: SpawnOptions,
): Observable<string> {

  const cmd = 'openssl'
  const args = [alg, '-pubout']
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }
  // args.push('-in', '-')

  const input$ = of(privateKey).pipe(
    delay(2000),
    shareReplay(),
  )

  const ret$ = run(cmd, args, { ...spawnOpts, inputStream: input$ }).pipe(
    map(buf => buf.toString()),
    tap(pem => {
      if (! pem || ! pem.includes('PUBLIC KEY')) {
        throw new Error('not PUBKEY: ' + pem)
      }
    }),
  )

  return ret$
}


function runOpenssl(args: string[], options?: Partial<RxSpawnOpts>): Observable<string> {
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
