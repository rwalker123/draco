import { Response } from 'express';
import contentDisposition from 'content-disposition';

export function sendCsvDownload(res: Response, fileName: string, buffer: Buffer): void {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', contentDisposition(fileName, { type: 'attachment' }));
  res.send(buffer);
}
