# RxRunScript
Run shell script or command in Node.js child process, Output `Observable<Buffer>`

[![Version](https://img.shields.io/npm/v/rxrunscript.svg)](https://www.npmjs.com/package/rxrunscript)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/waitingsong/rxrunscript.svg?branch=master)](https://travis-ci.org/waitingsong/rxrunscript)
[![Build status](https://ci.appveyor.com/api/projects/status/v5jt9imw2519nsax/branch/master?svg=true)](https://ci.appveyor.com/project/waitingsong/rxrunscript/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/waitingsong/rxrunscript/badge.svg?branch=master)](https://coveralls.io/github/waitingsong/rxrunscript?branch=master)




## Installing
```bash
$ npm install rxrunscript
```

## Usage
```ts
import { run } from 'rxrunscript'
import { take } from 'rxjs/operators'

run('openssl version')
  .pipe(
    take(1),  // assume all output in one buffer
  )
  .subscribe(
    buf => console.log(buf.toString()), 
    err => console.error(err),
  ) 

// exec shell file
run('./test/openssl.sh')
  .subscribe(
    arr => console.log(buf.toString()),
  )


import { reduce } from 'rxjs/operators'

// win32
run('tasklist')
  .pipe(
    reduce((acc: Buffer[], curr: Buffer) => {
      acc.push(curr)
      return acc
    }, []),
  )
  .subscribe(
    arr => console.log(Buffer.concat(arr).toString()),
    err => console.error(err),
    () => console.log('complete'),
  )

// run cmd file
run('./test/prepare.cmd')
  .subscribe(
    arr => console.log(buf.toString()),
  )

```


## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)
