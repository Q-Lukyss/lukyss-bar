import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CocktailsService } from './cocktails.service';
import { CreateCocktailDto } from './dto/create-cocktail.dto';
import { UpdateCocktailDto } from './dto/update-cocktail.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

const uploadPath = 'uploads/cocktails';

if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

function editFileName(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = extname(file.originalname);
  callback(null, `cocktail-${uniqueSuffix}${extension}`);
}

function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
    return callback(
      new BadRequestException(
        'Seules les images jpg, jpeg, png, webp sont autorisées',
      ),
      false,
    );
  }

  callback(null, true);
}

@Controller('cocktails')
export class CocktailsController {
  constructor(private readonly service: CocktailsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: uploadPath,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @Body() dto: CreateCocktailDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create({
      ...dto,
      image: file ? `/uploads/cocktails/${file.filename}` : null,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: uploadPath,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCocktailDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, {
      ...dto,
      ...(file ? { image: `/uploads/cocktails/${file.filename}` } : {}),
    });
  }
}
