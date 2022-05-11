import { spawn, ChildProcess, SpawnOptions } from 'child_process'

import { of, throwError, Observable } from 'rxjs'
import { catchError, mergeMap } from 'rxjs/operators'

import { bindEvent } from './bindevent'
import { initialRxRunOpts } from './config'
import { processOpts } from './prepare'
import { ExitCodeSignal, RxRunFnArgs } from './types'


/**
  * Reactive Running of Command Script
  * @param command {string}
  * @param args {string[]|null}
  * @param options {Partial<RxRunOpts>|null}
  *
  * @returns Observable<Buffer | ExitCodeSignal> the last value is the exit code and signal
  * @link https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
  */
export function run(
  command: RxRunFnArgs[0],
  args?: RxRunFnArgs[1],
  options?: RxRunFnArgs[2],
): Observable<Buffer | ExitCodeSignal> {

  const opts = processOpts({
    command, args, spawnOpts: options, initialRxRunOpts,
  })
  const { errScript } = opts
  const { errPrefix, stderrPrefix } = opts.spawnOpts.msgPrefixOpts
  const { inputStream } = opts.spawnOpts

  const proc$ = runSpawn(opts.command, opts.args, opts.spawnOpts)
  const ret$ = proc$.pipe(
    mergeMap((proc) => {
      return bindEvent(
        proc,
        opts.spawnOpts.stderrMaxBufferSize,
        opts.spawnOpts.msgPrefixOpts,
        opts.errScript,
        inputStream,
      )
    }),
    catchError((err: Error) => {
      const msg = err.message
      if (! msg.startsWith(errPrefix) && ! msg.startsWith(stderrPrefix)) {
        err.message = `${errPrefix} ${errScript}\n` + msg
      }
      throw err
    }),
  )

  return ret$
}


function runSpawn(
  command: string,
  runArgs: string[],
  spawnOpts: SpawnOptions,
): Observable<ChildProcess> {
  try {
    const proc = spawn(command, runArgs, spawnOpts)
    return of(proc)
  }
  catch (ex) {
    return throwError(() => ex as Error)
  }
}


export function escapeShell(cmd: string): string {
  return cmd.replace(/(["\s'$`\\])/ug, '\\$1')
}

