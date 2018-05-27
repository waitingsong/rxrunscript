# RxRunScript
Run shell script in Node.js child process, Output `Observable<Buffer>`

[![Version](https://img.shields.io/npm/v/rxrunscript.svg)](https://www.npmjs.com/package/rxrunscript)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/waitingsong/rxrunscript.svg?branch=master)](https://travis-ci.org/waitingsong/rxrunscript)
[![Build status](https://ci.appveyor.com/api/projects/status/v5jt9imw2519nsax/branch/master?svg=true)](https://ci.appveyor.com/project/waitingsong/rxrunscript/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/waitingsong/node-myca/badge.svg?branch=master)](https://coveralls.io/github/waitingsong/rxrunscript?branch=master)




## Installing
```bash
$ npm install rxrunscript
```

## Usage
```ts
import runScript from 'rxrunscript'
import { take } from 'rxjs/operators'

runScript('openssl version').pipe(
  take(1),  // assume all output in one buffer
)
  .subscribe(
    buf => console.log(buf.toString()), 
    err => console.error(err),
  ) 


import { reduce } from 'rxjs/operators'

// win32
runScript('tasklist').pipe(
  // should output many Buffers
  reduce((acc: Buffer[], curr: Buffer) => {
    acc.push(curr)
    return acc
  }, []),
)
  .subscribe(
    arr => console.log(buf.join('').toString()),
    err => console.error(err),
    () => console.log('complte'),
  )

```


## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)
