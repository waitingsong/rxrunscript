import { fromEvent, Observable } from 'rxjs'
// import { tap } from 'rxjs/operators'


export function bindStdoutData(stdout: NodeJS.ReadableStream): Observable<Buffer> {
  const data$ = fromEvent<Buffer>(stdout, 'data').pipe(
    // tap(buf => console.info('stdout:', buf.toString())),
  )
  return data$

}
