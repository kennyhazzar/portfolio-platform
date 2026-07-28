import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FastifyRequest } from 'fastify';

import { CommentCreateCommand } from '../../application/commands/comment.commands';
import { CommentsGetApprovedBySlugQuery } from '../../application/queries/comment.queries';
import { CommentTargetType } from '../../domain/comment-target.type';
import {
  CommentListQuery,
  CommentLocaleQuery,
  CommentsDto,
  CreateCommentBody,
  CreateCommentResponseDto,
} from '../dtos/comment.dto';
import { CommentMapper } from '../mappers/comment.mapper';

@ApiTags('comments')
@Controller()
export class CommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('posts/:slug/comments')
  @ApiOperation({ summary: 'Get approved comments for a post, newest first' })
  @ApiOkResponse({ type: CommentsDto })
  getPostComments(@Param('slug') slug: string, @Query() query: CommentListQuery): Promise<CommentsDto> {
    return this.getComments('post', slug, query);
  }

  @Get('cases/:slug/comments')
  @ApiOperation({ summary: 'Get approved comments for a case, newest first' })
  @ApiOkResponse({ type: CommentsDto })
  getCaseComments(@Param('slug') slug: string, @Query() query: CommentListQuery): Promise<CommentsDto> {
    return this.getComments('case', slug, query);
  }

  /** Captcha is the primary defense; this is defense-in-depth against a bot that clears it anyway. */
  @Post('posts/:slug/comments')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Submit a comment (public, unauthenticated) - lands as PENDING, requires a solved captcha',
  })
  @ApiCreatedResponse({ type: CreateCommentResponseDto })
  createPostComment(
    @Param('slug') slug: string,
    @Query() query: CommentLocaleQuery,
    @Body() body: CreateCommentBody,
    @Req() req: FastifyRequest,
  ): Promise<CreateCommentResponseDto> {
    return this.createComment('post', slug, query, body, req);
  }

  @Post('cases/:slug/comments')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Submit a comment for a case (public, unauthenticated) - lands as PENDING, requires a solved captcha',
  })
  @ApiCreatedResponse({ type: CreateCommentResponseDto })
  createCaseComment(
    @Param('slug') slug: string,
    @Query() query: CommentLocaleQuery,
    @Body() body: CreateCommentBody,
    @Req() req: FastifyRequest,
  ): Promise<CreateCommentResponseDto> {
    return this.createComment('case', slug, query, body, req);
  }

  private async getComments(
    targetType: CommentTargetType,
    slug: string,
    query: CommentListQuery,
  ): Promise<CommentsDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const locale = query.locale ?? 'ru';
    const result = await this.queryBus.execute(
      new CommentsGetApprovedBySlugQuery(targetType, locale, slug, page, perPage),
    );
    return { ...result, data: result.data.map(CommentMapper.toDto) };
  }

  private async createComment(
    targetType: CommentTargetType,
    slug: string,
    query: CommentLocaleQuery,
    body: CreateCommentBody,
    req: FastifyRequest,
  ): Promise<CreateCommentResponseDto> {
    const locale = query.locale ?? 'ru';
    const created = await this.commandBus.execute(
      new CommentCreateCommand(targetType, locale, slug, body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }),
    );
    return CommentMapper.toCreateResponseDto(created);
  }
}
