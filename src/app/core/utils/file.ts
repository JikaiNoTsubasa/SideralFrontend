/** Type de fichier (icône, libellé) déduit de l'extension du nom. */
export type FileKind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'word' | 'sheet' | 'slides' | 'archive' | 'code' | 'other';

const KINDS: Record<string, FileKind> = {
  pdf: 'pdf',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image', tif: 'image', tiff: 'image', heic: 'image',
  mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', m4a: 'audio',
  txt: 'text', md: 'text', log: 'text', csv: 'sheet', rtf: 'text',
  doc: 'word', docx: 'word', odt: 'word',
  xls: 'sheet', xlsx: 'sheet', ods: 'sheet',
  ppt: 'slides', pptx: 'slides', odp: 'slides',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  json: 'code', xml: 'code', html: 'code', css: 'code', js: 'code', ts: 'code', cs: 'code', java: 'code', py: 'code', sql: 'code', yml: 'code', yaml: 'code', sh: 'code',
};

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function fileKind(name: string): FileKind {
  return KINDS[extensionOf(name)] ?? 'other';
}

/** Aperçu possible dans le navigateur, d'après le type MIME déterminé par le serveur. */
export type PreviewKind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | null;

export function previewKind(contentType: string): PreviewKind {
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType === 'text/plain') return 'text';
  if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(contentType)) return 'image';
  if (['video/mp4', 'video/webm'].includes(contentType)) return 'video';
  if (['audio/mpeg', 'audio/ogg', 'audio/wav'].includes(contentType)) return 'audio';
  return null;
}

const UNITS = ['o', 'Ko', 'Mo', 'Go'];

export function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${UNITS[unit]}`;
}
