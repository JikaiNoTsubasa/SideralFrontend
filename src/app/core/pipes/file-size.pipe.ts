import { Pipe, PipeTransform } from '@angular/core';
import { formatSize } from '../utils/file';

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    return bytes == null ? '' : formatSize(bytes);
  }
}
