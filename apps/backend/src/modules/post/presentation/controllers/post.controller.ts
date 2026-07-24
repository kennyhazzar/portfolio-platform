import { Controller, Get, HttpCode, Param, Post as HttpPost, Query, Req } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FastifyRequest } from 'fastify';

import { PostRecordViewCommand } from '../../application/commands/post.commands';
import { PostGetPublishedBySlugQuery, PostsGetPublishedQuery } from '../../application/queries/post.queries';
import { PostDto, PostListQuery, PostLocaleQuery, PostsDto } from '../dtos/post.dto';
import { PostMapper } from '../mappers/post.mapper';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get published posts, newest first' })
  @ApiOkResponse({ type: PostsDto })
  async getPosts(@Query() query: PostListQuery): Promise<PostsDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const locale = query.locale ?? 'ru';
    const result = await this.queryBus.execute(new PostsGetPublishedQuery(locale, page, perPage));
    return { ...result, data: result.data.map((p) => PostMapper.toDto(p)) };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published post by its locale-specific slug' })
  @ApiOkResponse({ type: PostDto })
  async getPost(@Param('slug') slug: string, @Query() query: PostLocaleQuery): Promise<PostDto> {
    const locale = query.locale ?? 'ru';
    const found = await this.queryBus.execute(new PostGetPublishedBySlugQuery(locale, slug));
    return PostMapper.toDto(found);
  }

  @HttpPost(':slug/view')
  @HttpCode(204)
  @ApiOperation({ summary: 'Record a view for a published post (deduped per visitor)' })
  @ApiNoContentResponse()
  async recordView(
    @Param('slug') slug: string,
    @Query() query: PostLocaleQuery,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    const locale = query.locale ?? 'ru';
    await this.commandBus.execute(
      new PostRecordViewCommand(locale, slug, { ip: req.ip, userAgent: req.headers['user-agent'] }),
    );
  }
}
