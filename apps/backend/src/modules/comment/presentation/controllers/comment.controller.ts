import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FastifyRequest } from 'fastify';

import { CommentCreateCommand } from '../../application/commands/comment.commands';
import { CommentsGetApprovedByPostSlugQuery } from '../../application/queries/comment.queries';
import {
  CommentListQuery,
  CommentLocaleQuery,
  CommentsDto,
  CreateCommentBody,
  CreateCommentResponseDto,
} from '../dtos/comment.dto';
import { CommentMapper } from '../mappers/comment.mapper';

@ApiTags('comments')
@Controller('posts/:slug/comments')
export class CommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get approved comments for a post, newest first' })
  @ApiOkResponse({ type: CommentsDto })
  async getComments(@Param('slug') slug: string, @Query() query: CommentListQuery): Promise<CommentsDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const locale = query.locale ?? 'ru';
    const result = await this.queryBus.execute(new CommentsGetApprovedByPostSlugQuery(locale, slug, page, perPage));
    return { ...result, data: result.data.map(CommentMapper.toDto) };
  }

  /** Captcha is the primary defense; this is defense-in-depth against a bot that clears it anyway. */
  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Submit a comment (public, unauthenticated) — lands as PENDING, requires a solved captcha',
  })
  @ApiCreatedResponse({ type: CreateCommentResponseDto })
  async createComment(
    @Param('slug') slug: string,
    @Query() query: CommentLocaleQuery,
    @Body() body: CreateCommentBody,
    @Req() req: FastifyRequest,
  ): Promise<CreateCommentResponseDto> {
    const locale = query.locale ?? 'ru';
    const created = await this.commandBus.execute(
      new CommentCreateCommand(locale, slug, body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }),
    );
    return CommentMapper.toCreateResponseDto(created);
  }
}
