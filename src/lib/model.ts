import { ChildProcess } from 'child_process'


export interface MsgPrefix {
  errPrefix: string
  stderrPrefix: string
}

export interface HandleBaseOpts {
  /** cmd script string */
  msgInfo: string
  stderrArr: Buffer[]
}

export interface HandleStderrOpt extends HandleBaseOpts {
  proc: ChildProcess
  stderrBufLimit: number
  stderrPrefix: string
}

export interface HandleCloseOpts extends HandleBaseOpts {
  code: number
  hasNext: boolean
  stderrPrefix: string
}

export interface HandleErrOpts {
  errPrefix: string
  msgInfo: string
}
