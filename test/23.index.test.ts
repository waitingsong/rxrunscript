import assert from 'node:assert/strict'
import { sep, join } from 'path'

import { fileShortPath, genCurrentDirname } from '@waiting/shared-core'
import { concat, from as ofrom, of } from 'rxjs'
import {
  catchError,
  concatMap,
  defaultIfEmpty,
  filter,
  finalize,
  mergeMap,
  tap,
  timeout,
} from 'rxjs/operators'

import { run, RxRunFnArgs } from '../src/index.js'


const __dirname = genCurrentDirname(import.meta.url)

describe(fileShortPath(import.meta.url), () => {
  const file = 'openssl.sh'
  const path = join(__dirname, file)
  const appDirName = join(__dirname, '..')

  if (process.platform === 'win32') {
    console.info('skip test under win32')
    return
  }
  console.info('Current path:', __dirname)
  console.info('process.cwd:', process.cwd())

  it.skip(`Should running "${file}" work without Permission`, (done) => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')
    if (! appDirName) {
      assert(false)
      return
    }

    // must inner it()
    const chmod$ = run('chmod u-x', [join(__dirname, file)])
    const ls$ = run('ls -al', [path]).pipe(
      tap((val) => {
        if (Buffer.isBuffer(val)) {
          console.log('file should has no x rights:\n', val.toString())
        }
      }),
    )

    const cmds: RxRunFnArgs[] = [
      [path],
      [`./test/${file}`],
      [`../${appDirName}/test/${file}`],
    ]
    const ret$ = ofrom(cmds).pipe(
      concatMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap((val) => {
            if (Buffer.isBuffer(val)) {
              const ret = val.toString().trim()
              assert(! ret.includes('OpenSSL '), `Should not output OpenSSL version. But result: "${ret}"`)
            }
          }),
          catchError((err: Error) => {
            const msg = err.message
            assert(
              msg.includes('Permission denied') && msg.includes(file),
              'Should throw error cause of Permission denied',
            )
            return of(Buffer.from(''))
          }),
        )
      }),
      finalize(() => done()),
    )

    concat(chmod$, ls$, ret$)
      .pipe(timeout(90000))
      .subscribe()
  })

  it(`Should running "${file}" work`, (done) => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')

    const isTravis = __dirname.includes('travis')

    // must inner it()
    // const chmod$ = run('chmod u+x', [path])
    const ls$ = run('ls -al', [path]).pipe(
      tap((val) => {
        if (Buffer.isBuffer(val)) {
          console.log('file should has x rights:\n', val.toString())
        }
      }),
    )
    const cat$ = run('cat', [path]).pipe(
      tap((val) => {
        if (Buffer.isBuffer(val)) {
          console.log('cat file result:\n', val.toString())
        }
      }),
    )

    const cmds: RxRunFnArgs[] = [
      ['sh', [path] ],
      // [path],
      // [`./test/${file}`],
      // [`../${appDirName}/test/${file}`],
    ]
    const ret$ = ofrom(cmds).pipe(
      filter(([cmd, args]) => {
        console.info(`\nStarting cmds: "${cmd}"`, args && args.length ? args[0] : '')
        const skipped = ! isTravis
        if (isTravis) {
          console.info(
            `Skip "${cmd}" under travis cause of file will not found. But test passed under local test!`,
          )
        }
        return skipped
      }),
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          defaultIfEmpty(Buffer.from('foo')),
          tap((val) => {
            if (Buffer.isBuffer(val)) {
              const ret = val.toString().trim()
              console.info('Runner script result:' + ret)
              console.info('Runner script result buf:', val)
              console.info(`Runner script cmd: ${cmd}, args: ${args ? args.join(' ') : ''}`)
              assert(ret.includes('OpenSSL '), `Should output OpenSSL version. But result: "${ret}"`)
            }
          }),
          timeout(90000),
        )
      }, 1),
      finalize(() => done()),
    )

    concat(ls$, cat$, ret$)
      .pipe(timeout(90000))
      .subscribe()
  })

  it.skip(`Should running "${file}" work`, (done) => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')

    const isTravis = __dirname.includes('travis')

    // must inner it()
    const chmod$ = run('chmod +x', [path])
    const ls$ = run('ls -al', [path]).pipe(
      tap(val => Buffer.isBuffer(val) && console.log('file should has x rights:\n', val.toString())),
    )
    const cat$ = run('cat', [path]).pipe(
      tap(val => Buffer.isBuffer(val) && console.log('cat file result:\n', val.toString())),
    )

    if (! appDirName) {
      assert(false)
      return
    }

    const cmds: RxRunFnArgs[] = [
      // ['sh', [path] ],
      [path],
      [`./test/${file}`],
      [`../${appDirName}/test/${file}`],
    ]
    const ret$ = ofrom(cmds).pipe(
      filter(([cmd, args]) => {
        console.info(`\nStarting cmds: "${cmd}"`, args && args.length ? args[0] : '')
        const skipped = ! isTravis
        if (isTravis) {
          console.info(
            `Skip "${cmd}" under travis cause of file will not found. But test passed under local test!`,
          )
        }
        return skipped
      }),
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          defaultIfEmpty(Buffer.from('foo')),
          tap((val) => {
            if (Buffer.isBuffer(val)) {
              const ret = val.toString().trim()
              console.info('Runner script result:' + ret)
              console.info('Runner script result buf:', val)
              console.info(`Runner script cmd: ${cmd}, args: ${args ? args.join(' ') : ''}`)
              assert(ret.includes('OpenSSL '), `Should output OpenSSL version. But result: "${ret}"`)
            }
          }),
          timeout(60000),
        )
      }, 1),
      finalize(() => done()),
    )

    concat(chmod$, ls$, cat$, ret$)
      .pipe(timeout(90000))
      .subscribe()
  })

})

