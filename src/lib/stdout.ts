import { fromEvent, Observable } from 'rxjs'


export function bindStdoutData(stdout: NodeJS.ReadableStream): Observable<Buffer> {
  stdout.on('data', data => {

  })
  const data$ = fromEvent<Buffer>(stdout, 'data').pipe(
    // tap(buf => console.info('stdout:', buf.toString())),
  )
  return data$

}
