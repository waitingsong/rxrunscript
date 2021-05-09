/// <reference types="mocha" />

import {
  basename,
  join,
} from '@waiting/shared-core'
import * as assert from 'power-assert'

import { escapeShell } from '../src/index'


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
