import { SpawnOptions } from 'child_process'

import { MsgPrefixOpts, RxRunOpts } from './model'


export const initialSpawnOpts: SpawnOptions = {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: 'pipe',
}

export const initialMsgPrefixOpts: MsgPrefixOpts = {
  errPrefix: 'Run script with error:',
  stderrPrefix: 'Run script with stderr:',
}

export const initialRxRunOpts: RxRunOpts = {
  msgPrefixOpts: initialMsgPrefixOpts,
  stderrMaxBufferSize: 200,
}
