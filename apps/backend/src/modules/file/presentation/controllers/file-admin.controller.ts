import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FastifyRequest } from 'fastify';

import type { IdType } from '@/interfaces/id.type';
import { RoleType } from '@/enums/role-type.enum';
import { FileFrom } from '@/enums/file-from.enum';
import { FileType } from '@/enums/file-type.enum';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { CurrentRoleType } from '@/decorators/current-role-type.decorator';
import { ReorderBody } from '@/common/Reorder';
import {
  FileDeleteCommand,
  FileReorderCommand,
  FileSetCoverCommand,
  FilesUploadCommand,
} from '../../application/commands';
import { FilesGetByExternalIdQuery } from '../../application/queries';
import { FileDto, FilesByExternalIdQuery, UploadFileBody } from '../dtos/file.dto';
import { FileMapper } from '../mappers/file.mapper';

type MultipartField = {
  type: 'field';
  fieldname: string;
  value?: string;
};

type MultipartFile = {
  type: 'file';
  fieldname: string;
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
};

/**
 * Admin-facing upload/manage endpoints backing FileUploadField/MediaGalleryField
 * (docs/planning/05-admin-panel.md §1) — distinct from file.controller.ts's self-upload
 * (hardcoded to FileFrom.USER + currentUserId), gated on the existing Subjects.FILE_ADMIN
 * (already seeded for the Administrator role, no roles.config.ts change needed).
 */
@ApiTags('admin/files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/files')
export class FileAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.FILE_ADMIN)
  @ApiOperation({
    summary: 'Get files attached to one entity instance (admin) — backs FileUploadField/MediaGalleryField',
  })
  @ApiOkResponse({ type: [FileDto] })
  async getFiles(@Query() query: FilesByExternalIdQuery): Promise<FileDto[]> {
    const files = await this.queryBus.execute(new FilesGetByExternalIdQuery(query.module, query.externalId));
    return files.map(FileMapper.toDto);
  }

  @Post()
  @Policy(Actions.CREATE, Subjects.FILE_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        module: { type: 'string', enum: Object.values(FileFrom) },
        externalId: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: Object.values(FileType) },
        name: {
          type: 'string',
          description: 'Fixed slot name for single-file fields (e.g. "cover"); omit for gallery uploads.',
        },
        description: { type: 'string' },
        isCover: { type: 'boolean' },
      },
      required: ['file', 'module', 'externalId', 'type'],
    },
  })
  @ApiOperation({
    summary: 'Upload a file attached to an entity instance (admin) — cover/gallery images, résumé, favicon',
  })
  @ApiOkResponse({ type: FileDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async uploadFile(@Req() request: FastifyRequest, @CurrentUserId() currentUserId: IdType): Promise<FileDto> {
    const upload = await this.parseAdminUpload(request);
    const result = await this.commandBus.execute(new FilesUploadCommand({ payload: [upload], currentUserId }));
    const [created] = result.data;
    if (!created) throw new BadRequestException('file.uploadFailed');
    return created;
  }

  @Patch('reorder')
  @Policy(Actions.UPDATE, Subjects.FILE_ADMIN)
  @ApiOperation({ summary: 'Bulk-reorder gallery files for drag-and-drop (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  async reorderFiles(@Body() body: ReorderBody): Promise<{ success: boolean }> {
    await this.commandBus.execute(new FileReorderCommand(body.items));
    return { success: true };
  }

  @Patch(':id/cover')
  @Policy(Actions.UPDATE, Subjects.FILE_ADMIN)
  @ApiOperation({ summary: 'Mark a gallery file as the cover, unsetting any previous cover (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  async setCover(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new FileSetCoverCommand(id));
    return { success: true };
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.FILE_ADMIN)
  @ApiOperation({ summary: 'Delete a file (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new FileDeleteCommand({ fileId: id, currentUserId, currentRoleType }));
    return { success: true };
  }

  private async parseAdminUpload(request: FastifyRequest): Promise<UploadFileBody> {
    const multipartRequest = request as FastifyRequest & {
      parts?: () => AsyncIterableIterator<MultipartField | MultipartFile>;
    };
    if (typeof multipartRequest.parts !== 'function') {
      throw new BadRequestException('file.multipartRequired');
    }

    const fields: Record<string, string> = {};
    let fileInfo: { buffer: Buffer; filename: string; mimetype: string } | null = null;

    // A file part's stream must be drained (toBuffer()) before the `parts()` iterator can
    // advance to the next part — deferring this until after the loop (as an earlier version of
    // this method did) leaves the file part's backpressure unresolved and hangs the whole
    // request forever for any file too large to fit in the stream's internal buffer by accident
    // (file.controller.ts's parseCurrentUserUploads already gets this right, for comparison).
    for await (const part of multipartRequest.parts()) {
      if (part.type === 'field') {
        fields[part.fieldname] = typeof part.value === 'string' ? part.value : '';
        continue;
      }
      if (part.type === 'file' && part.fieldname === 'file') {
        fileInfo = {
          buffer: await part.toBuffer(),
          filename: part.filename,
          mimetype: part.mimetype,
        };
      }
    }

    if (!fileInfo) throw new BadRequestException('file.fileRequired');
    if (!fields.module || !Object.values(FileFrom).includes(fields.module as FileFrom)) {
      throw new BadRequestException('file.invalidModule');
    }
    if (!fields.externalId) throw new BadRequestException('file.externalIdRequired');
    if (!fields.type || !Object.values(FileType).includes(fields.type as FileType)) {
      throw new BadRequestException('file.invalidType');
    }

    // Gallery uploads (no fixed slot name) get a generated unique name so the (name, module,
    // externalId) unique constraint never collides between two same-named uploads — single-slot
    // fields (cover/photo/resume/favicon) always pass a fixed `name`, relying on that same
    // constraint (via onConflictDoUpdate in FileRepositoryDrizzle.uploads) to replace in place.
    const name = fields.name?.trim() || this.makeUniqueGalleryName(fileInfo.filename);

    return {
      name,
      description: fields.description?.trim() || undefined,
      module: fields.module as FileFrom,
      externalId: fields.externalId,
      type: fields.type as FileType,
      isCover: fields.isCover === 'true',
      file: {
        filename: fileInfo.filename || name,
        mimetype: fileInfo.mimetype || 'application/octet-stream',
        createReadStream: () => Readable.from(fileInfo.buffer),
      },
    };
  }

  private makeUniqueGalleryName(originalFilename: string): string {
    const dotIndex = originalFilename.lastIndexOf('.');
    const base = dotIndex > 0 ? originalFilename.slice(0, dotIndex) : originalFilename || 'file';
    const ext = dotIndex > 0 ? originalFilename.slice(dotIndex) : '';
    return `${base}-${randomUUID().slice(0, 8)}${ext}`;
  }
}
