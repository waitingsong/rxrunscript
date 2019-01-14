import { ChildProcess } from 'child_process'
import { merge, EMPTY, Observable, Subject } from 'rxjs'
import {
  catchError,
  finalize,
  ignoreElements,
  tap,
} from 'rxjs/operators'


export function bindStdinData(
  stdin: ChildProcess['stdin'],
  inputData$: Observable<any>,
): Observable<never> {

  const err$ = new Subject<Error>()

  const input$ = inputData$.pipe(
    tap(data => {
      // console.log('bindStdinData:', data)
      // debug in vsc below will cause EPIPE error
      stdin.write(data, err => {
        if (err) {
          err$.next(err)
        }
      })
    }),
    catchError((err: Error) => {
      err$.next(err)
      return EMPTY
    }),
    ignoreElements(),
    finalize(() => {
      stdin.end()
      err$.complete()
    }),
  )

  const ret$ = <Observable<never>> merge(
    err$.asObservable(),
    input$,
  ).pipe(
    tap((err: Error) => { // from err$
      throw err
    }),
  )

  return ret$
}
