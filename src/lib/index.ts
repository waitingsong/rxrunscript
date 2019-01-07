import { spawn, ChildProcess, SpawnOptions } from 'child_process'
import { merge, of, Observable } from 'rxjs'
import { catchError, defaultIfEmpty, finalize, mergeMap, takeUntil, tap } from 'rxjs/operators'

import { join } from '../shared/index'

import { initialMsgPrefixOpts, initialSpawnOpts } from './config'
import { MsgPrefixOpts, RunSpawnOpts } from './model'
import { bindProcClose } from './proc-close'
import { bindProcError } from './proc-error'
import { bindStderrData } from './stderr'
import { bindStdoutData } from './stdout'


 /**
  * Run script
  * @param command {string}
  * @param args {string[]|null}
  * @param options {SpawnOptions|null}
  * @param stderrMaxBufferSize {number} Default 0
  *   - program may output running infomation via stderr and running result via stdout
  *   - 0|nagetive: ignore and no error() emitted
  *   - positive: emit error() if up to stderrMaxBufferSize, may output stdout both
  *
  * @link https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
  */
export function run(
  command: string,
  args?: ReadonlyArray<string> | null,
  options?: SpawnOptions | null,
  stderrMaxBufferSize: number = 0,
): Observable<Buffer> {

  const {
    errScript,
    maxBufferSize,
    runSpawnOpts,
  } = processOpts(command, args, options, stderrMaxBufferSize)

  const proc$ = runSpawn(runSpawnOpts)
  const ret$ = proc$.pipe(
    mergeMap(proc => {
      return bindEvent(
        proc,
        maxBufferSize,
        initialMsgPrefixOpts,
        errScript,
      )
    }),
  )

  return ret$
}

function runSpawn(options: RunSpawnOpts): Observable<ChildProcess> {
  const { command, runArgs, spawnOpts } = options
  // console.info('runSpanwn opts:', command, runArgs)
  const proc = spawn(command, runArgs, spawnOpts)
  return of(proc)
}


function processOpts(
  command: string,
  args?: ReadonlyArray<string> | null,
  options?: SpawnOptions | null,
  stderrMaxBufferSize?: number,
) {

  command = command ? command.trim() : ''
  /* istanbul ignore else */
  if (!command) {
    throw new TypeError('Run command is blank')
  }
  command = command.replace(/\\/g, '/').trimLeft()

  const spawnOpts = options ? { ...initialSpawnOpts, ...options } : initialSpawnOpts

  spawnOpts.shell = true
  /* istanbul ignore else */
  if (process.platform === 'win32') {
    spawnOpts.windowsVerbatimArguments = true

    /* istanbul ignore else */
    if (command.slice(0, 2) === './' || command.slice(0, 3) === '../') {
      const arr = command.split(' ')

      arr[0] = join(<string> spawnOpts.cwd, arr[0])
      command = arr.join(' ')
    }
  }

  const runArgs = args && args.length ? [...args] : []

  const errScript = `"${command} ${runArgs.join(' ')}"`
  const maxBufferSize = typeof stderrMaxBufferSize === 'number' && stderrMaxBufferSize > 0
    ? +stderrMaxBufferSize
    : 0
  const runSpawnOpts = { command, runArgs, spawnOpts }

  return {
    errScript,
    maxBufferSize,
    runSpawnOpts,
  }
}


function bindEvent(
  proc: ChildProcess,
  stderrMaxBufTimes: number,
  msgPrefixOpts: MsgPrefixOpts,
  script: string,
): Observable<Buffer> {

  const { errPrefix, stderrPrefix } = msgPrefixOpts

  const close$ = bindProcClose(proc)
  const stdout$ = bindStdoutData(proc.stdout)
  const stderr$ = bindStderrData(proc.stderr, stderrMaxBufTimes).pipe(
    tap(buf => {
      const msg = buf.toString()
      throw new Error(`${stderrPrefix} ${script}\n${msg}`)
    }),
  )
  const error$ = bindProcError(proc).pipe(
    catchError((err: Error) => {
      err.message = `${errPrefix} ${script}\n` + (err && err.message ? err.message : '')
      throw err
    }),
  )

  const ret$ = merge(
    stdout$,
    stderr$,
    error$,
  ).pipe(
    takeUntil(close$),
    defaultIfEmpty(Buffer.from('\0')),
    finalize(() => {
      // sub process may not stop
      // link: https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
      proc.killed || proc.kill()
    }),
  )

  return ret$
}


export function escapeShell(cmd: string): string {
  return cmd.replace(/(["\s'$`\\])/g, '\\$1')
}
