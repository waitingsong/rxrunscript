import { SpawnOptions } from 'node:child_process'

import { MsgPrefixOpts, RxSpawnOpts } from './types.js'


export const initialSpawnOpts: SpawnOptions = {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: 'pipe',
}

export const initialMsgPrefixOpts: MsgPrefixOpts = {
  errPrefix: 'Run script with error:',
  stderrPrefix: 'Run script with stderr:',
}

export const initialRxRunOpts: RxSpawnOpts = {
  maxCmdLength: 2048,
  msgPrefixOpts: initialMsgPrefixOpts,
  stderrMaxBufferSize: 200,
}
