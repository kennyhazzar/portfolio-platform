import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Locale } from '@/interfaces/locale.type';

export class HeroTranslationDto {
  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  headline?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  ctaLabel?: string;
}

/** Public, single-locale, flat shape — what the frontend's Server Components consume. */
export class HeroDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional()
  ctaUrl?: string;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  headline?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  ctaLabel?: string;
}

/** Admin shape — all translations at once, for the bilingual edit form. */
export class HeroAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional()
  ctaUrl?: string;

  @ApiProperty({ type: [HeroTranslationDto] })
  translations!: HeroTranslationDto[];
}

export class HeroTranslationBody {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaLabel?: string;
}

export class UpdateHeroBody {
  @ApiPropertyOptional({ description: 'Locale-agnostic CTA link target (internal path or external URL)' })
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiProperty({ type: HeroTranslationBody })
  @ValidateNested()
  @Type(() => HeroTranslationBody)
  ru!: HeroTranslationBody;

  @ApiProperty({ type: HeroTranslationBody })
  @ValidateNested()
  @Type(() => HeroTranslationBody)
  en!: HeroTranslationBody;
}

export class HeroLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}
