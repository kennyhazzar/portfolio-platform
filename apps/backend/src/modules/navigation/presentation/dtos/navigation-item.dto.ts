import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

import { Locale } from '@/interfaces/locale.type';

export class NavigationItemTranslationDto {
  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  label!: string;
}

/** Public, single-locale, flat shape. */
export class NavigationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  parentId?: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  label!: string;
}

/** Admin shape — all translations at once, plus isVisible. */
export class NavigationItemAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  parentId?: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  isVisible!: boolean;

  @ApiProperty({ type: [NavigationItemTranslationDto] })
  translations!: NavigationItemTranslationDto[];
}

export class NavigationItemTranslationBody {
  @ApiProperty()
  @IsString()
  label!: string;
}

export class CreateNavigationItemBody {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ type: NavigationItemTranslationBody })
  @ValidateNested()
  @Type(() => NavigationItemTranslationBody)
  ru!: NavigationItemTranslationBody;

  @ApiProperty({ type: NavigationItemTranslationBody })
  @ValidateNested()
  @Type(() => NavigationItemTranslationBody)
  en!: NavigationItemTranslationBody;
}

export class UpdateNavigationItemBody {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ type: NavigationItemTranslationBody })
  @IsOptional()
  @ValidateNested()
  @Type(() => NavigationItemTranslationBody)
  ru?: NavigationItemTranslationBody;

  @ApiPropertyOptional({ type: NavigationItemTranslationBody })
  @IsOptional()
  @ValidateNested()
  @Type(() => NavigationItemTranslationBody)
  en?: NavigationItemTranslationBody;
}

export class NavigationLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  locale?: Locale;
}
