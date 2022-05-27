import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'

import { escapeShell } from '../src/index.js'


describe(fileShortPath(import.meta.url), () => {

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
