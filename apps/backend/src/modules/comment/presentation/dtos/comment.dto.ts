import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEmpty, IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { CommentStatus } from '@/enums/comment-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { Paginated, PaginationQuery } from '@/common/Paginated';

/** Public shape — approved comments only, never exposes authorEmail. */
export class CommentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Parent comment for threaded replies' })
  parentCommentId?: string;

  @ApiProperty()
  authorName!: string;

  @ApiPropertyOptional()
  authorUrl?: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ enum: ['ru', 'en'] })
  locale!: Locale;

  @ApiProperty()
  createdAt!: Date;
}

export class CommentsDto extends Paginated(CommentDto) {}

/** Returned only from the create endpoint, so the client can tell a pending submission
 * apart from one that landed APPROVED (comments.autoApprove) without exposing status
 * on the public list, which is always APPROVED-only anyway. */
export class CreateCommentResponseDto extends CommentDto {
  @ApiProperty({ enum: CommentStatus })
  status!: CommentStatus;
}

/** Admin/moderation shape — includes contact email and status, still never ipAddressHash. */
export class CommentAdminDto extends CommentDto {
  @ApiPropertyOptional()
  authorEmail?: string;

  @ApiProperty({ enum: CommentStatus })
  status!: CommentStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  postId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  caseId?: string;
}

export class CommentsAdminDto extends Paginated(CommentAdminDto) {}

export class CreateCommentBody {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  authorName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorUrl?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Parent comment for threaded replies' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  @ApiProperty({ description: 'Id of a captcha challenge already solved by the client' })
  @IsUUID()
  captchaChallengeId!: string;

  @ApiProperty({ description: "The visitor's answer to the captcha challenge" })
  @IsString()
  captchaAnswer!: string;

  @ApiPropertyOptional({
    description: 'Honeypot — must stay empty. A real visitor never sees or fills this field.',
  })
  @IsOptional()
  @IsEmpty()
  website?: string;
}

export class UpdateCommentStatusBody {
  @ApiProperty({ enum: CommentStatus })
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}

export class CommentLocaleQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}

// Separate class, not an intersection type — see CaseListQuery's comment in case.dto.ts.
export class CommentListQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: ['ru', 'en'], default: 'ru' })
  @IsOptional()
  @IsIn(['ru', 'en'])
  locale?: Locale;
}

export class CommentAdminFilterQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: CommentStatus, description: 'Defaults to PENDING (the moderation queue)' })
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;
}
