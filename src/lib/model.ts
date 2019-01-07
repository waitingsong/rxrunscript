import { SpawnOptions } from 'child_process'


export interface MsgPrefixOpts {
  errPrefix: string
  stderrPrefix: string
}

export interface RxRunFnArgs
  extends Array<string | ReadonlyArray<string> | SpawnOptions | null | number | void> {
  /** command */
  0: string
  /** args */
  1?: ReadonlyArray<string> | null
  2?: SpawnOptions | null
  /** maxBufferSize for stderr */
  3?: number
}

export interface RunSpawnOpts {
  command: string
  runArgs: string[]
  spawnOpts: SpawnOptions
}
