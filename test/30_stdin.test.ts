/* eslint-disable node/no-unpublished-import */
import { spawn, SpawnOptions } from 'child_process'

import {
  basename,
  join,
} from '@waiting/shared-core'
import { from as ofrom, merge, of, EMPTY, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  defaultIfEmpty,
  delay,
  finalize,
  last,
  map,
  mapTo,
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

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)

describe(filename, () => {

  describe('Should bindStdinData() works', () => {
    const spawnOpts: SpawnOptions = {
      windowsVerbatimArguments: true,
      shell: true,
    }
    if (process.platform === 'win32') {
      spawnOpts.cwd = 'c:/Program Files/Git/mingw64/bin'
    }

    it('Should got pubkey', (done) => {
      const pass: string = Math.random().toString()
      const keyBits = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap(pkey => genPubKeyFromPrivateKeyWithDefaultValue(pkey, pass, 'rsa', spawnOpts)),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should got stderr with invalid passwd', (done) => {
      const pass: string = Math.random().toString()
      const keyBits = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap(pkey => genPubKeyFromPrivateKey(pkey, 'fakepasswd', 'rsa', spawnOpts)),
        tap((stderr) => {
          if (stderr && stderr.includes('stderr')) {
            assert(stderr.includes('unable to load Private'), stderr)
          }
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should throw "write after end" error', (done) => {
      const pass: string = Math.random().toString()
      const keyBits = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap((pkey) => {
          return genPubKeyFromPrivateKeyForError(pkey, pass, 'rsa', spawnOpts)
        }),
        catchError((err: Error) => {
          assert(
            err instanceof Error
            && err.message.includes('write after end'),
            `Should throw "write after end" error, but with "${err.message}"`,
          )
          return EMPTY
        }),
      )

      ret$.pipe(finalize(() => done())).subscribe()
    })

    it('Should throw "This socket is closed" error', (done) => {
      const pass: string = Math.random().toString()
      const keyBits = 2048
      const ret$ = genRSAKey(pass, keyBits).pipe(
        mergeMap(pkey => genPubKeyFromPrivateKeyForCloseError(pkey, pass, 'rsa', spawnOpts)),
        catchError((err: Error) => {
          assert(
            err instanceof Error
            && (err.message.includes('This socket is closed')
              || err.message.includes('Cannot call write after a stream was destroyed')),
            `Should throw "This socket is closed" error, but throw ${err.message}`,
          )
          return EMPTY
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

    it('Should got pubkey', (done) => {
      const pass: string = Math.random().toString()
      const keyBits = 2048
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
    tap((stdout) => {
      if (! stdout || ! stdout.includes('PRIVATE KEY')) {
        throw new Error(`generate private key failed. stdout: "${stdout}"`)
      }
    }),
  )
}


function genPubKeyFromPrivateKeyWithDefaultValue(
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
  // args.push('-in', '-') // for CLI test

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
    defaultIfEmpty('no stdout output'),
    tap((pem) => {
      if (! pem || ! pem.includes('PUBLIC KEY')) {
        throw new Error('not PUBKEY: ' + pem)
      }
    }),
  )
  const stderr$ = bindStderrData(proc.stderr, takeUntilNotifier$, of('output'), 200).pipe(
    map(buf => buf.toString()),
    map((str) => {
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
  // args.push('-in', '-') // for CLI test

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
    // defaultIfEmpty('no stdout output'),
    tap((pem) => {
      if (! pem || ! pem.includes('PUBLIC KEY')) {
        throw new Error('not PUBKEY: ' + pem)
      }
    }),
  )
  const stderr$ = bindStderrData(proc.stderr, takeUntilNotifier$, of('output'), 200).pipe(
    map(buf => buf.toString()),
    map((str) => {
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


function genPubKeyFromPrivateKeyForError(
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
  // args.push('-in', '-') // for CLI test

  const proc = spawn(cmd, args, spawnOpts)
  const input$ = of(privateKey).pipe(
    tap(() => {
      assert(proc.stdin)
      // close stdin for test write again
      // @ts-expect-error
      return proc.stdin.end()
    }), // close stdint
    shareReplay(),
  )
  const takeUntilNotifier$ = input$.pipe(
    last(),
    delay(3500),
  )

  const stdin$ = bindStdinData(proc.stdin, input$).pipe()
  const stderr$ = bindStderrData(proc.stderr, takeUntilNotifier$, of('output'), 200).pipe(
    map(buf => buf.toString()),
    map((str) => {
      return `stderr: ${str}`
    }),
  )

  const ret$ = merge(
    stdin$,
    stderr$,
  )

  return ret$
}


function genPubKeyFromPrivateKeyForCloseError(
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
  // args.push('-in', '-') // for CLI test

  const proc = spawn(cmd, args, spawnOpts)

  const write$ = of(proc.stdin).pipe(
    delay(500),
    tap((stdin) => {
      assert(stdin)
      // @ts-expect-error
      stdin.write(privateKey)
    }),
    mapTo('write ok'),
  )

  const input$ = of(privateKey).pipe(
    delay(2000),
    shareReplay(),
  )
  const takeUntilNotifier$ = input$.pipe(
    last(),
    delay(4000),
  )

  const stdin$ = bindStdinData(proc.stdin, input$)
  const stderr$ = bindStderrData(proc.stderr, takeUntilNotifier$, of('output'), 200).pipe(
    map(buf => buf.toString()),
    map((str) => {
      return `stderr: ${str}`
    }),
  )

  const ret$ = merge(
    write$,
    stdin$,
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
  // args.push('-in', '-') // for CLI test

  const input$ = of(privateKey).pipe(
    delay(2000),
    shareReplay(),
  )

  const ret$ = run(cmd, args, { ...spawnOpts, inputStream: input$ }).pipe(
    map(buf => buf.toString()),
    defaultIfEmpty('no output'),
    tap((pem) => {
      if (! pem || ! pem.includes('PUBLIC KEY')) {
        throw new Error('not PUBKEY: ' + pem)
      }
    }),
  )

  return ret$
}


function runOpenssl(args: string[], options?: Partial<RxSpawnOpts>): Observable<string> {
  const script = 'openssl'
  const opts = {
    ...options,
  }
  if (! opts.cwd && process.platform === 'win32') {
    opts.cwd = 'c:/Program Files/Git/mingw64/bin'
  }

  const ret$ = run(script, args, opts)

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
