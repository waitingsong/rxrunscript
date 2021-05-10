import {
  basename,
  join,
} from '@waiting/shared-core'

import { escapeShell } from '../src/index'

// eslint-disable-next-line import/order
import assert = require('power-assert')


const filename = basename(__filename)


describe(filename, () => {

  it('Should escapeShell works', () => {
    let command = ''
    let expect = ''
    let ret = escapeShell(command)
    assert(ret === expect)

    command = ' '
    expect = '\\ '
    ret = escapeShell(command)
    assert(ret === expect)

    command = '\\'
    expect = '\\\\'
    ret = escapeShell(command)
    assert(ret === expect, ret)

    command = '\''
    expect = '\\\''
    ret = escapeShell(command)
    assert(ret === expect, ret)

    command = '"'
    expect = '\\"'
    ret = escapeShell(command)
    assert(ret === expect, ret)

    command = '$'
    expect = '\\$'
    ret = escapeShell(command)
    assert(ret === expect, ret)
  })
})
