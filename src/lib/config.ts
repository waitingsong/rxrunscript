import { SpawnOptions } from 'child_process'

import { MsgPrefixOpts } from './model'


export const initialSpawnOpts: SpawnOptions = {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: 'pipe',
}

export const initialMsgPrefixOpts: MsgPrefixOpts = {
  errPrefix: 'Run script with error:',
  stderrPrefix: 'Run script with stderr:',
}
