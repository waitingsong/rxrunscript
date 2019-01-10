import { join } from '../shared/index'

import { initialMsgPrefixOpts, initialSpawnOpts } from './config'
import { ProcessOpts, RxRunFnArgs, RxSpawnOpts } from './model'


export function processOpts(options: ProcessOpts) {
  const { args, initialRxRunOpts } = options
  const spawnOpts: RxSpawnOpts = processSpawnOpts(initialRxRunOpts, options.spawnOpts)

  const cmd = processCommand(
    options.command,
    initialRxRunOpts.msgPrefixOpts.errPrefix,
    spawnOpts,
  )
  const runArgs = args && args.length ? [...args] : []
  const errScript = runArgs.length
    ? `"${cmd} ${runArgs.join(' ')}"`
    : `"${cmd}"`

  return {
    command: cmd,
    args: runArgs,
    spawnOpts,
    errScript,
  }
}

function processSpawnOpts(
  defaultRxrunOpts: RxSpawnOpts,
  options?: RxRunFnArgs[2],
): RxSpawnOpts {

  const opts = <RxSpawnOpts> (options ? { ...initialSpawnOpts, ...options } : initialSpawnOpts)

  opts.shell = true
  /* istanbul ignore next */
  if (process.platform === 'win32') {
    opts.windowsVerbatimArguments = true
  }

  /* istanbul ignore else */
  if (typeof opts.stderrMaxBufferSize !== 'number' || opts.stderrMaxBufferSize < 0) {
    opts.stderrMaxBufferSize = +defaultRxrunOpts.stderrMaxBufferSize
  }
  opts.msgPrefixOpts = { ...initialMsgPrefixOpts }

  return opts
}


function processCommand(
  command: string,
  errPrefix: string,
  spawnOpts: RxSpawnOpts,
): string {

  let cmd = command ? command.trim() : ''
  /* istanbul ignore else */
  if (!cmd) {
    throw new TypeError(`${errPrefix}\nRun command is blank`)
  }

  const cmdLead = cmd.slice(0, 3).replace(/\\/g, '/')
  /* istanbul ignore else */
  if (spawnOpts.cwd && (cmdLead === '../' || cmdLead.slice(0, 2) === './')) {
    cmd = join(spawnOpts.cwd, cmd)
  }

  /* istanbul ignore else */
  if (cmd.length > 1000) {
    throw new TypeError(
      `${errPrefix}\nCommand length exceed 1000\n` + cmd.slice(1000) + ' ...')
  }

  return cmd
}
