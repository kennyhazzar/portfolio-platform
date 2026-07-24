import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { PaginationQuery } from '@/common/Paginated';
import { IdType } from '@/interfaces/id.type';
import { PostCreateCommand, PostDeleteCommand, PostUpdateCommand } from '../../application/commands/post.commands';
import {
  PostGetByIdQuery,
  PostGetBySlugAnyStatusQuery,
  PostsGetAdminQuery,
} from '../../application/queries/post.queries';
import {
  CreatePostBody,
  PostAdminDto,
  PostDto,
  PostLocaleQuery,
  PostsAdminDto,
  UpdatePostBody,
} from '../dtos/post.dto';
import { PostMapper } from '../mappers/post.mapper';

@ApiTags('admin/posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/posts')
export class PostAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.POST)
  @ApiOperation({ summary: 'Get all posts regardless of status (admin)' })
  @ApiOkResponse({ type: PostsAdminDto })
  async getPosts(@Query() query: PaginationQuery): Promise<PostsAdminDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const result = await this.queryBus.execute(new PostsGetAdminQuery(page, perPage));
    return { ...result, data: result.data.map((p) => PostMapper.toAdminDto(p)) };
  }

  @Get('preview/:slug')
  @Policy(Actions.READ, Subjects.POST)
  @ApiOperation({
    summary:
      'Get a post by slug regardless of status (admin) — backs Draft Mode preview (docs/planning/05-admin-panel.md §3)',
  })
  @ApiOkResponse({ type: PostDto })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  async previewPost(@Param('slug') slug: string, @Query() query: PostLocaleQuery): Promise<PostDto> {
    const locale = query.locale ?? 'ru';
    const found = await this.queryBus.execute(new PostGetBySlugAnyStatusQuery(locale, slug));
    return PostMapper.toDto(found);
  }

  @Get(':id')
  @Policy(Actions.READ, Subjects.POST)
  @ApiOperation({ summary: 'Get post by ID with all translations (admin)' })
  @ApiOkResponse({ type: PostAdminDto })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  async getPost(@Param('id', ParseUUIDPipe) id: string): Promise<PostAdminDto> {
    const found = await this.queryBus.execute(new PostGetByIdQuery(id));
    return PostMapper.toAdminDto(found);
  }

  @HttpPost()
  @Policy(Actions.CREATE, Subjects.POST)
  @ApiOperation({ summary: 'Create post as DRAFT, authored by the current admin (admin)' })
  @ApiCreatedResponse({ type: PostAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async createPost(@CurrentUserId() currentUserId: IdType, @Body() body: CreatePostBody): Promise<PostAdminDto> {
    const created = await this.commandBus.execute(new PostCreateCommand(currentUserId, body));
    return PostMapper.toAdminDto(created);
  }

  @Patch(':id')
  @Policy(Actions.UPDATE, Subjects.POST)
  @ApiOperation({ summary: 'Update post, including publish/unpublish via status (admin)' })
  @ApiOkResponse({ type: PostAdminDto })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdatePostBody): Promise<PostAdminDto> {
    const updated = await this.commandBus.execute(new PostUpdateCommand(id, body));
    return PostMapper.toAdminDto(updated);
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.POST)
  @ApiOperation({ summary: 'Soft-delete a post (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async deletePost(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new PostDeleteCommand(id));
    return { success: true };
  }
}
