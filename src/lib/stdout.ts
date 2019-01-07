import { fromEvent, Observable } from 'rxjs'
import { map } from 'rxjs/operators'


export function bindStdoutData(stdout: NodeJS.ReadableStream): Observable<Buffer> {
  const data$ = fromEvent<any>(stdout, 'data').pipe(
    map(data => Buffer.isBuffer(data) ? data : Buffer.from(data)),
    // tap(buf => console.info('stdout:', buf.toString())),
  )
  return data$
}
