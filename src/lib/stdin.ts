import { NEVER, Observable } from 'rxjs'
import {
  delay,
  finalize,
  mergeMap,
  shareReplay,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators'


export function bindStdinData(
  stdin: NodeJS.WritableStream,
  takeUntilNotifier$: Observable<any>,
  inputData$: Observable<any>,
): Observable<never> {

  // stdin.setEncoding('utf-8')

  const take$ = takeUntilNotifier$.pipe(
    take(1),
    shareReplay(),
  )

  const ret$ = inputData$.pipe(
    // tap(val => {
    //   console.log(val)
    // }),
    // takeUntil(take$),
    delay(1000),
    tap(data => {
      if (data) {
        stdin.write(data, (err: Error | void) => {
          if (err) {
            throw err
          }
        })
      }
      else {
        stdin.end()
      }
    }),
    finalize(() => stdin.end()),
    mergeMap(() => NEVER),
  )

  return ret$
}
