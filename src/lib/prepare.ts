import { join } from '../shared/index'

import { initialSpawnOpts } from './config'
import { ProcessOpts, RunSpawnOpts, RxRunOpts } from './model'


export function processOpts(options: ProcessOpts) {
  const { args, initialRxRunOpts } = options
  const rxrunOpts = processRxrunOpts(initialRxRunOpts, options.rxrunOpts)

  const cmd = processCommand(
    options.command,
    initialRxRunOpts.msgPrefixOpts.errPrefix,
    rxrunOpts,
  )
  const runArgs = args && args.length ? [...args] : []

  const errScript = `"${cmd} ${runArgs.join(' ')}"`
  const runSpawnOpts: RunSpawnOpts = {
    command: cmd,
    runArgs,
    spawnOpts: rxrunOpts,
  }

  return {
    errScript,
    runSpawnOpts,
    stderrMaxBufferSize: rxrunOpts.stderrMaxBufferSize,
  }
}

function processRxrunOpts(
  defaultRxrunOpts: RxRunOpts,
  options?: Partial<RxRunOpts>,
): RxRunOpts {

  const opts = <RxRunOpts> (options ? { ...initialSpawnOpts, ...options } : initialSpawnOpts)
  opts.shell = true
  /* istanbul ignore else */
  if (process.platform === 'win32') {
    opts.windowsVerbatimArguments = true
  }

  /* istanbul ignore else */
  if (typeof opts.stderrMaxBufferSize !== 'number' || opts.stderrMaxBufferSize < 0) {
    opts.stderrMaxBufferSize = +defaultRxrunOpts.stderrMaxBufferSize
  }

  return opts
}


function processCommand(
  command: string,
  errPrefix: string,
  rxrunOpts: RxRunOpts,
): string {

  let cmd = command ? command.trim() : ''
  /* istanbul ignore else */
  if (!cmd) {
    throw new TypeError(`${errPrefix}\nRun command is blank`)
  }
  cmd = cmd.replace(/\\/g, '/').trimLeft()

  /* istanbul ignore else */
  if (process.platform === 'win32') {
    /* istanbul ignore else */
    if (cmd.slice(0, 2) === './' || cmd.slice(0, 3) === '../') {
      const arr = cmd.split(' ')

      arr[0] = join(<string> rxrunOpts.cwd, arr[0])
      cmd = arr.join(' ')
    }
  }

  /* istanbul ignore else */
  if (cmd.length > 1000) {
    throw new TypeError(
      `${errPrefix}\nCommand length exceed 1000\n` + cmd.slice(1000) + ' ...')
  }

  return cmd
}
