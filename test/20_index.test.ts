/// <reference types="mocha" />

import {
  basename,
  join,
} from '@waiting/shared-core'
import { sep } from 'path'
import * as assert from 'power-assert'
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


const filename = basename(__filename)


describe(filename, () => {
  it('Should works running openssl', done => {
    const cmds: RxRunFnArgs[] = [
      ['openssl version'],
      ['openssl  version'],
      ['openssl', ['version'] ],
      ['openssl ', [' version'] ],
    ]

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts)
      }),
    )
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            assert(ret.includes('OpenSSL'), `result: "${ret}"`)
          }
          catch (ex) {
            assert(false, ex)
          }
        },
        err => {
          assert(false, err)
          done()
        },
        done,
      )

  })

  it('Should works running openssl with invalid args', done => {
    const cmds: RxRunFnArgs[] = [
      ['openssl fake'],
      ['openssl ', ['fake'] ],
    ]
    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts)
      }),
    )
      .subscribe(
        buf => {
          try {
            const ret = buf.toString()
            assert(!ret.includes('OpenSSL'), `should got error but got result: "${ret}"`)
          }
          catch (ex) {
            assert(true)
          }
        },
        err => {
          assert(true)
          done()
        },
        done,
    )
  })

  it('Should throw error with unknown command', done => {
    const cmds: RxRunFnArgs[] = [
      ['fakefoo'],
      ['fakefoo ', ['fake'] ],
      // ['openssl version'],
      // opensslCmds[0],
    ]
    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap(buf => {
            assert(false, 'Should not got data from stdout' + buf.toString())
          }),
          catchError((err: Error) => {
            return of(Buffer.from(''))
          }),
        )
      }),
      finalize(() => {
        done()
      }),
    ).subscribe()
  })


})


describe(filename, () => {
  const file = join(__dirname, 'interval-source.ts')
  let count = Math.floor(Math.random() * 10)
  const options = {
    cwd: __dirname, // ! for test/tsconfig.json
  }

  if (count < 3) {
    count = 3
  }
  const cmds: RxRunFnArgs[] = [
    [`ts-node ${file} ${count}`, null, options],
    [' ts-node ', [`${file} ${count}`], options],
    ['ts-node ', [file, count.toString()], options],
  ]

  it('Should works running interval-source.ts with random count serially', done => {
    if (process.platform === 'win32') {
      console.info('skip test under win32')
      return done()
    }
    console.info('start test count serially:', count)

    ofrom(cmds).pipe(
      concatMap(([cmd, args, opts]) => testIntervalSource(cmd, args, opts, count)),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })

  it('Should works running interval-source.ts with random count parallelly', done => {
    if (process.platform === 'win32') {
      console.info('skip test under win32')
      return done()
    }
    console.info('start test count parallelly:', count)

    ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => testIntervalSource(cmd, args, opts, count)),
      finalize(() => done()),
      catchError((err: Error) => {
        assert(false, err.message)
        return EMPTY
      }),
    ).subscribe()
  })

})


describe(filename, () => {
  const file = 'prepare.cmd'
  const appDirName = __dirname.split(sep).slice(-2, -1)[0]

  if (process.platform !== 'win32') {
    console.info('skip test under non-win32')
    return
  }

  it(`Should running "${file}" works`, done => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')

    const cmds: RxRunFnArgs[] = [
      [`./test/${file} ${ Math.random().toString() } `],

      [`./test/${file}`, [Math.random().toString()] ],
      [`./test/${file}`, [Math.random().toString(), '--'] ],
      [join('./test', file), [Math.random().toString()] ],
      [join('./test', file), [Math.random().toString(), '--'] ],

      [`../${appDirName}/test/${file}`, [Math.random().toString()] ],
      [join('..', appDirName, 'test', file), [Math.random().toString()] ],
    ]
    const ret$ = ofrom(cmds).pipe(
      mergeMap(([cmd, args, opts]) => {
        return run(cmd, args, opts).pipe(
          tap(buf => {
            const ret = buf.toString().trim()
            assert(ret && ret.includes(file))
            if (args && args[0]) {
              assert(ret.includes(<string> args[0]))
            }
          }),
        )
      }),
      finalize(() => done()),
    )

    ret$.subscribe()
  })
})


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

  it(`Should running "${file}" works without Permission`, done => {
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
          tap(buf => {
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

  it(`Should running "${file}" works`, done => {
    assert(typeof appDirName === 'string' && appDirName.length > 0, 'Working folder invalid')

    const isTravis = __dirname.includes('travis')

    // must inner it()
    const chmod$ = run('chmod u+x', [join(__dirname, file)])
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
        console.info(`\nStarting cmds: "${cmd}"`, (args && args.length ? args[0] : ''))
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
          tap(buf => {
            const ret = buf.toString().trim()
            console.info('Runner script result:' + ret)
            assert(ret.includes('OpenSSL '), `Should output OpenSSL version. But result: "${ret}"`)
          }),
          timeout(5000),
        )
      }),
      finalize(() => done()),
    )

    concat(chmod$, ls$, cat$, ret$)
      .pipe(timeout(50000))
      .subscribe()
  })
})
