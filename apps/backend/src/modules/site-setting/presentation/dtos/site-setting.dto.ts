import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Locale } from '@/interfaces/locale.type';

export class SiteSettingTranslationDto {
  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  footerText?: string;

  @ApiPropertyOptional()
  copyrightText?: string;

  @ApiPropertyOptional()
  defaultSeoTitle?: string;

  @ApiPropertyOptional()
  defaultSeoDescription?: string;
}

/** Public, single-locale, flat shape. */
export class SiteSettingDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  footerText?: string;

  @ApiPropertyOptional()
  copyrightText?: string;

  @ApiPropertyOptional()
  defaultSeoTitle?: string;

  @ApiPropertyOptional()
  defaultSeoDescription?: string;
}

/** Admin shape — all translations at once. */
export class SiteSettingAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [SiteSettingTranslationDto] })
  translations!: SiteSettingTranslationDto[];
}

export class SiteSettingTranslationBody {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  copyrightText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultSeoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultSeoDescription?: string;
}

export class UpdateSiteSettingBody {
  @ApiProperty({ type: SiteSettingTranslationBody })
  @ValidateNested()
  @Type(() => SiteSettingTranslationBody)
  ru!: SiteSettingTranslationBody;

  @ApiProperty({ type: SiteSettingTranslationBody })
  @ValidateNested()
  @Type(() => SiteSettingTranslationBody)
  en!: SiteSettingTranslationBody;
}

export class SiteSettingLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}
