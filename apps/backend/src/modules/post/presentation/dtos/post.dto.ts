import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ContentStatus } from '@/enums/content-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { Paginated, PaginationQuery } from '@/common/Paginated';

/** Public, single-locale, flat shape — a post is written once, in one language, no RU+EN pair. */
export class PostDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  excerpt!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  seoDescription?: string;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  viewCount!: number;
}

export class PostsDto extends Paginated(PostDto) {}

/** Admin shape — all statuses, same flat single-locale fields plus the author. */
export class PostAdminDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  authorUserId!: string;

  @ApiProperty({ enum: ContentStatus })
  status!: ContentStatus;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  excerpt!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  seoDescription?: string;
}

export class PostsAdminDto extends Paginated(PostAdminDto) {}

export class CreatePostBody {
  @ApiProperty({ enum: ['ru', 'en'], description: 'Fixed at creation — the one language this post is written in' })
  @IsIn(['ru', 'en'])
  locale!: Locale;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  excerpt!: string;

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

export class UpdatePostBody {
  @ApiPropertyOptional({ enum: ContentStatus, description: 'Publish/unpublish is just changing this field' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;
}

export class ImportPostItemBody extends CreatePostBody {
  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class ImportPostsBody {
  @ApiProperty({ type: [ImportPostItemBody], maxItems: 200 })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ImportPostItemBody)
  items!: ImportPostItemBody[];
}

export class ImportResultDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  created!: number;

  @ApiProperty()
  updated!: number;

  @ApiProperty()
  skipped!: number;
}

export class PostLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}

// Separate class, not an intersection type — see CaseListQuery's comment in case.dto.ts.
export class PostListQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}
