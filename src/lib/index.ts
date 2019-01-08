import { spawn, ChildProcess } from 'child_process'
import { of, Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { bindEvent } from './bindevent'
import { initialMsgPrefixOpts, initialRxRunOpts } from './config'
import { RunSpawnOpts, RxRunFnArgs } from './model'
import { processOpts } from './prepare'


 /**
  * Reactive Running of Command Script
  * @param command {string}
  * @param args {string[]|null}
  * @param options {Partial<RxRunOpts>|null}
  *
  * @returns Observable<Buffer>
  * @link https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
  */
export function run(
  command: RxRunFnArgs[0],
  args?: RxRunFnArgs[1],
  options?: RxRunFnArgs[2],
): Observable<Buffer> {

  const {
    errScript,
    stderrMaxBufferSize,
    runSpawnOpts,
  } = processOpts({
    command, args, rxrunOpts: options, initialRxRunOpts,
  })

  const proc$ = runSpawn(runSpawnOpts)
  const ret$ = proc$.pipe(
    mergeMap(proc => {
      return bindEvent(
        proc,
        stderrMaxBufferSize,
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


export function escapeShell(cmd: string): string {
  return cmd.replace(/(["\s'$`\\])/g, '\\$1')
}
