import { Observable } from 'rxjs'
import {
  finalize,
  ignoreElements,
  tap,
} from 'rxjs/operators'


export function bindStdinData(
  stdin: NodeJS.WritableStream,
  inputData$: Observable<any>,
): Observable<never> {

  const ret$ = inputData$.pipe(
    tap(data => {
      // console.log('bindStdinData:', data)
      // debug in vsc below will cause EPIPE error
      stdin.write(data, (err: Error | void) => {
        if (err) {
          throw err
        }
      })
    }),
    ignoreElements(),
    finalize(() => stdin.end()),
  )

  return ret$
}
