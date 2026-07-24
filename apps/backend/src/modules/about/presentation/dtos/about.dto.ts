import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Locale } from '@/interfaces/locale.type';

export class AboutTranslationDto {
  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  bio!: string;
}

/** Public, single-locale, flat shape. */
export class AboutDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  bio!: string;
}

/** Admin shape — all translations at once. */
export class AboutAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [AboutTranslationDto] })
  translations!: AboutTranslationDto[];
}

export class AboutTranslationBody {
  @ApiProperty()
  @IsString()
  bio!: string;
}

export class UpdateAboutBody {
  @ApiProperty({ type: AboutTranslationBody })
  @ValidateNested()
  @Type(() => AboutTranslationBody)
  ru!: AboutTranslationBody;

  @ApiProperty({ type: AboutTranslationBody })
  @ValidateNested()
  @Type(() => AboutTranslationBody)
  en!: AboutTranslationBody;
}

export class AboutLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}
