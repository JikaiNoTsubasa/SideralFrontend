/**
 * Recadre une image au centre en carré et la redimensionne (côté navigateur, avant envoi).
 * Produit du WebP, ou du JPEG si le navigateur ne sait pas encoder le WebP.
 */
export async function resizeToSquare(file: Blob, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const target = Math.min(size, side);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = target;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D non disponible.');
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, target, target);

    const webp = await toBlob(canvas, 'image/webp', 0.9);
    if (webp?.type === 'image/webp') {
      return webp;
    }
    const jpeg = await toBlob(canvas, 'image/jpeg', 0.9);
    if (!jpeg) {
      throw new Error('Encodage impossible.');
    }
    return jpeg;
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
