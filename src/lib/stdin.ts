import { ChildProcess } from 'child_process'

import { merge, EMPTY, Observable, Subject } from 'rxjs'
import {
  catchError,
  finalize,
  ignoreElements,
  map,
  mergeMap,
  tap,
} from 'rxjs/operators'


export function bindStdinData(
  stdin: ChildProcess['stdin'],
  inputData$: Observable<unknown>,
): Observable<never> {

  if (! stdin) {
    throw new Error('stdint null')
  }

  const input$ = inputData$.pipe(
    mergeMap((data) => {
      // console.log('bindStdinData:', data)
      // debug in vsc below will cause EPIPE error
      return new Promise((done, reject) => {
        const ended = stdin.writableEnded
        // prevent "Uncaught Error [ERR_STREAM_WRITE_AFTER_END]: write after end",
        // even if use try/catch
        if (ended) {
          const err = new Error(' write after end')
          // @ts-expect-error
          err.code = 'ERR_STREAM_WRITE_AFTER_END'
          return reject(err)
        }

        stdin.write(data, (err) => {
          if (err) {
            reject(err)
            return
          }
          done(data)
        })
      })
    }),
    ignoreElements(),
    finalize(() => {
      stdin.end()
    }),
  )

  return input$
}

