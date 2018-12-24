# RxRunScript
调用 Node.js child process 执行脚本, 输出 `Observable<Buffer>` 可观察对象

[![Version](https://img.shields.io/npm/v/rxrunscript.svg)](https://www.npmjs.com/package/rxrunscript)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/waitingsong/rxrunscript.svg?branch=master)](https://travis-ci.org/waitingsong/rxrunscript)
[![Build status](https://ci.appveyor.com/api/projects/status/v5jt9imw2519nsax/branch/master?svg=true)](https://ci.appveyor.com/project/waitingsong/rxrunscript/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/waitingsong/node-myca/badge.svg?branch=master)](https://coveralls.io/github/waitingsong/rxrunscript?branch=master)



## 安装
```bash
$ npm install rxrunscript
```

## 使用
```ts
import { run } from 'rxrunscript'
import { take } from 'rxjs/operators'

run('openssl version')
  .pipe(
    take(1),  // 假定一个 Buffer 就包括了所有输出
  )
  .subscribe(
    buf => console.log(buf.toString()), 
    err => console.error(err),
  ) 


import { reduce } from 'rxjs/operators'

// win32
run('tasklist')
  .pipe(
    // 应该输出多个 Buffer
    reduce((acc: Buffer[], curr: Buffer) => {
      acc.push(curr)
      return acc
    }, []),
  )
  .subscribe(
    arr => console.log(buf.join('').toString()),
    err => console.error(err),
    () => console.log('complete'),
  )

```


## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)
