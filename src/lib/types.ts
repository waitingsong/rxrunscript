import { SpawnOptions } from 'node:child_process'

import { Observable } from 'rxjs'


export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export type SpawnOptionsPatical = Omit<SpawnOptions, 'stdio'>
export interface RxSpawnOpts extends SpawnOptionsPatical {
  msgPrefixOpts: MsgPrefixOpts
  /**
   * maxBufferSize for stderr. default: 200
   * - program may output running infomation via stderr and running result via stdout
   * - 0 | nagetive: ignore and no error() emitted
   * - positive: emit error() if subprocess exit with non zero | null code
   */
  stderrMaxBufferSize: number
  /**
   * emit data with subprocess.stdin.write()
   */
  inputStream?: Observable<unknown>
  /**
   * Maximum length of command.
   * 0: unlimited.
   * Default: 2048 (byte)
   */
  maxCmdLength?: number
}

export interface MsgPrefixOpts {
  errPrefix: string
  stderrPrefix: string
}

export interface RxRunFnArgs extends
  Array<string | readonly string[] | Partial<RxSpawnOpts> | null | void> {
  /** command */
  0: string
  /** args */
  1?: readonly string[] | null | undefined
  2?: Partial<RxSpawnOpts> | null | undefined
}


/**
 * @link - https://nodejs.org/api/child_process.html#child_process_event_close
 */
export type ProcCloseOrExitCodeSignal = [ExitCode, ExitSignal]
export interface ExitCodeSignal {
  readonly exitCode: number
  readonly exitSignal: string | null
}
export type ExitCode = number
export type ExitSignal = string | null

export interface OutputRow {
  /**
   * - number menas the last row,  0: success, other: error
   * - undefined means not the last row
   */
  readonly exitCode?: ExitCodeSignal['exitCode']
  readonly exitSignal?: ExitCodeSignal['exitSignal']
  readonly data: Buffer
}


/** Inner usage for processOpts() */
export interface ProcessOpts {
  command: RxRunFnArgs[0]
  args?: RxRunFnArgs[1]
  spawnOpts?: RxRunFnArgs[2]
  initialRxRunOpts: RxSpawnOpts
}
