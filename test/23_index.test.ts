import { error } from 'console'
import { sep } from 'path'

import {
  basename,
  join,
} from '@waiting/shared-core'
import { concat, from as ofrom, of, EMPTY } from 'rxjs'
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

import { run, RxRunFnArgs } from '../src/index'

import { opensslCmds, testIntervalSource } from './helper'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)



describe(filename, () => {
  const file = 'openssl.sh'
  const path = join(__dirname, file)
  const appDirName = __dirname.split(sep).slice(-2, -1)[0]

  if (process.platform === 'win32') {
    console.info('skip test under win32')
    return
  }
  console.info('Current path:', __dirname)
  console.info('process.cwd:', process.cwd())

  it(`Should running "${file}" works without Permission`, (done) => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')

    // must inner it()
    const chmod$ = run('chmod a-x', [join(__dirname, file)])
    const ls$ = run('ls -al', [path]).pipe(
      tap(buf => console.log('file should has no x rights:\n', buf.toString())),
    )

    const cmds: RxRunFnArgs[] = [
      [path],
      [`./test/${file}`],
      [`../${appDirName}/test/${file}`],
    ]
    const ret$ = ofrom(cmds).pipe(
      concatMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap((buf) => {
            const ret = buf.toString().trim()
            assert(! ret.includes('OpenSSL '), `Should not output OpenSSL version. But result: "${ret}"`)
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
      .pipe(timeout(30000))
      .subscribe()
  })

  it(`Should running "${file}" works`, (done) => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')

    const isTravis = __dirname.includes('travis')

    // must inner it()
    const chmod$ = run('chmod a+x', [path])
    const ls$ = run('ls -al', [path]).pipe(
      tap(buf => console.log('file should has x rights:\n', buf.toString())),
    )
    const cat$ = run('cat', [path]).pipe(
      tap(buf => console.log('cat file result:\n', buf.toString())),
    )

    const cmds: RxRunFnArgs[] = [
      ['sh', [path] ],
      [path],
      [`./test/${file}`],
      [`../${appDirName}/test/${file}`],
    ]
    const ret$ = ofrom(cmds).pipe(
      filter(([cmd, args], index) => {
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
          tap((buf) => {
            const ret = buf.toString().trim()
            console.info('Runner script result:' + ret)
            console.info('Runner script result buf:', buf)
            console.info(`Runner script cmd: ${cmd}, args: ${args ? args.join(' ') : ''}`)
            assert(ret.includes('OpenSSL '), `Should output OpenSSL version. But result: "${ret}"`)
          }),
          timeout(5000),
        )
      }, 1),
      finalize(() => done()),
    )

    concat(chmod$, ls$, cat$, ret$)
      .pipe(timeout(50000))
      .subscribe()
  })
})

