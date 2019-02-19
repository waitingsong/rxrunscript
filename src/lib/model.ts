import { SpawnOptions } from 'child_process'
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
  inputStream?: Observable<any>
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
  Array<string | ReadonlyArray<string> | Partial<RxSpawnOpts> | null | void> {
  /** command */
  0: string
  /** args */
  1?: ReadonlyArray<string> | null
  2?: Partial<RxSpawnOpts> | null
}


/**
 * @link - https://nodejs.org/api/child_process.html#child_process_event_close
 */
export interface ProcCloseOrExitCodeSignal extends Array<number | string | null> {
  /** code */
  0: number | null,
  /** signal */
  1: string | null,
}


/** Inner usage for processOpts() */
export interface ProcessOpts {
  command: RxRunFnArgs[0]
  args?: RxRunFnArgs[1]
  spawnOpts?: RxRunFnArgs[2]
  initialRxRunOpts: RxSpawnOpts
}
