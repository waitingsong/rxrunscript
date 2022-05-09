import assert from 'assert/strict'
import { relative } from 'path'

import { escapeShell } from '../src/index'


const filename = relative(process.cwd(), __filename).replace(/\\/ug, '/')

describe(filename, () => {

  it('Should escapeShell work', () => {
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
