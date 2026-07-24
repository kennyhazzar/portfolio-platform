import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

import { ContentStatus } from '@/enums/content-status.enum';
import { TechnologyCategory } from '@/enums/technology-category.enum';
import { Locale } from '@/interfaces/locale.type';
import { Paginated, PaginationQuery } from '@/common/Paginated';

export class CaseTechnologyRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: TechnologyCategory })
  category!: TechnologyCategory;

  @ApiPropertyOptional()
  iconSlug?: string;
}

/** Public, single-locale, flat shape. */
export class CaseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  seoDescription?: string;

  @ApiPropertyOptional()
  repoUrl?: string;

  @ApiPropertyOptional()
  liveUrl?: string;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty({ type: [CaseTechnologyRefDto] })
  technologies!: CaseTechnologyRefDto[];

  @ApiProperty({
    description: 'Sibling-locale slugs, for hreflang / locale switcher',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  alternates!: Partial<Record<Locale, string>>;
}

export class CasesDto extends Paginated(CaseDto) {}

export class CaseTranslationDto {
  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  seoDescription?: string;
}

/** Admin shape — all statuses, all translations at once. */
export class CaseAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ContentStatus })
  status!: ContentStatus;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  position!: number;

  @ApiPropertyOptional()
  repoUrl?: string;

  @ApiPropertyOptional()
  liveUrl?: string;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty({ type: [String] })
  technologyIds!: string[];

  @ApiProperty({ type: [CaseTranslationDto] })
  translations!: CaseTranslationDto[];
}

export class CasesAdminDto extends Paginated(CaseAdminDto) {}

export class CaseTranslationBody {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  summary!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;
}

export class CreateCaseBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  liveUrl?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technologyIds?: string[];

  @ApiProperty({ type: CaseTranslationBody })
  @ValidateNested()
  @Type(() => CaseTranslationBody)
  ru!: CaseTranslationBody;

  @ApiProperty({ type: CaseTranslationBody })
  @ValidateNested()
  @Type(() => CaseTranslationBody)
  en!: CaseTranslationBody;
}

export class UpdateCaseBody {
  @ApiPropertyOptional({ enum: ContentStatus, description: 'Publish/unpublish is just changing this field' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  liveUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technologyIds?: string[];

  @ApiPropertyOptional({ type: CaseTranslationBody })
  @IsOptional()
  @ValidateNested()
  @Type(() => CaseTranslationBody)
  ru?: CaseTranslationBody;

  @ApiPropertyOptional({ type: CaseTranslationBody })
  @IsOptional()
  @ValidateNested()
  @Type(() => CaseTranslationBody)
  en?: CaseTranslationBody;
}

export class CaseLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}

// A separate class (not an intersection type) — NestJS/Swagger can't introspect query
// parameters from a `PaginationQuery & CaseLocaleQuery` intersection on @Query(), so the list
// endpoint needs its own concrete DTO combining both sets of fields.
export class CaseListQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}
