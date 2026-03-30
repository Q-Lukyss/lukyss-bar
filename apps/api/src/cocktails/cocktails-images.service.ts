import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

@Injectable()
export class CocktailImagesService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'cocktails');
  private readonly allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);
  private readonly maxFileSize = 5 * 1024 * 1024;

  async saveImage(file?: File | null): Promise<string | null> {
    if (!file) return null;

    if (!this.allowedMimeTypes.has(file.type)) {
      throw new BadRequestException(
        'Seules les images jpg, jpeg, png, webp sont autorisées',
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        'Le fichier image dépasse la taille maximale de 5 Mo',
      );
    }

    await mkdir(this.uploadDir, { recursive: true });

    const extension = this.getExtension(file);
    const filename = `cocktail-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(this.uploadDir, filename), buffer);

    return `/uploads/cocktails/${filename}`;
  }

  private getExtension(file: File): string {
    const fromName = extname(file.name || '').toLowerCase();
    if (fromName) return fromName;

    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        throw new BadRequestException('Extension de fichier non supportée');
    }
  }
}
