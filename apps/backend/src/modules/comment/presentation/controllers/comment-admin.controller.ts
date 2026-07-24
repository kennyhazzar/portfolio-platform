import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { CommentStatus } from '@/enums/comment-status.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { CommentDeleteCommand, CommentUpdateStatusCommand } from '../../application/commands/comment.commands';
import { CommentGetByIdQuery, CommentsGetAdminQuery } from '../../application/queries/comment.queries';
import {
  CommentAdminDto,
  CommentAdminFilterQuery,
  CommentsAdminDto,
  UpdateCommentStatusBody,
} from '../dtos/comment.dto';
import { CommentMapper } from '../mappers/comment.mapper';

@ApiTags('admin/comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/comments')
export class CommentAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.COMMENT)
  @ApiOperation({ summary: 'Moderation queue — defaults to PENDING comments (admin)' })
  @ApiOkResponse({ type: CommentsAdminDto })
  async getComments(@Query() query: CommentAdminFilterQuery): Promise<CommentsAdminDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const status = query.status ?? CommentStatus.PENDING;
    const result = await this.queryBus.execute(new CommentsGetAdminQuery(status, page, perPage));
    return { ...result, data: result.data.map(CommentMapper.toAdminDto) };
  }

  @Get(':id')
  @Policy(Actions.READ, Subjects.COMMENT)
  @ApiOperation({ summary: 'Get comment by ID (admin)' })
  @ApiOkResponse({ type: CommentAdminDto })
  @ApiNotFoundResponse({ description: 'Comment not found.' })
  async getComment(@Param('id', ParseUUIDPipe) id: string): Promise<CommentAdminDto> {
    const found = await this.queryBus.execute(new CommentGetByIdQuery(id));
    return CommentMapper.toAdminDto(found);
  }

  @Patch(':id')
  @Policy(Actions.UPDATE, Subjects.COMMENT)
  @ApiOperation({ summary: 'Approve, reject, or mark spam by changing status (admin)' })
  @ApiOkResponse({ type: CommentAdminDto })
  @ApiNotFoundResponse({ description: 'Comment not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCommentStatusBody,
  ): Promise<CommentAdminDto> {
    const updated = await this.commandBus.execute(new CommentUpdateStatusCommand(id, body.status));
    return CommentMapper.toAdminDto(updated);
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.COMMENT)
  @ApiOperation({ summary: 'Delete comment (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Comment not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async deleteComment(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new CommentDeleteCommand(id));
    return { success: true };
  }
}
