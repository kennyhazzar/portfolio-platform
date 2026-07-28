import { createHash } from 'node:crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { PaginatedResult } from '@/common/Paginated';
import { CommentStatus } from '@/enums/comment-status.enum';
import { VerifyCaptchaChallengeCommand } from '@/modules/captcha/application/commands/captcha.commands';
import { Comment } from '../../domain/entities/comment.entity';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentCreateCommand, CommentDeleteCommand, CommentUpdateStatusCommand } from '../commands/comment.commands';
import { CommentGetByIdQuery, CommentsGetAdminQuery, CommentsGetApprovedBySlugQuery } from '../queries/comment.queries';

@QueryHandler(CommentsGetApprovedBySlugQuery)
export class CommentsGetApprovedBySlugHandler implements IQueryHandler<CommentsGetApprovedBySlugQuery> {
  constructor(private readonly commentRepository: CommentRepository) {}

  execute({
    targetType,
    locale,
    slug,
    page,
    perPage,
  }: CommentsGetApprovedBySlugQuery): Promise<PaginatedResult<Comment>> {
    return this.commentRepository.findApprovedBySlug(targetType, locale, slug, page, perPage);
  }
}

@QueryHandler(CommentsGetAdminQuery)
export class CommentsGetAdminHandler implements IQueryHandler<CommentsGetAdminQuery> {
  constructor(private readonly commentRepository: CommentRepository) {}

  execute({ status, page, perPage }: CommentsGetAdminQuery): Promise<PaginatedResult<Comment>> {
    return this.commentRepository.findAllAdmin(status, page, perPage);
  }
}

@QueryHandler(CommentGetByIdQuery)
export class CommentGetByIdHandler implements IQueryHandler<CommentGetByIdQuery> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute({ id }: CommentGetByIdQuery): Promise<Comment> {
    const found = await this.commentRepository.findById(id);
    if (!found) throw new NotFoundException(`Comment ${id} not found.`);
    return found;
  }
}

/**
 * Reuses the existing captcha subsystem via CommandBus rather than duplicating verification
 * logic — see docs/planning/02-content-model.md §7 and docs/planning/03-backend-build-order.md §9.
 * The honeypot field is already rejected upstream by the DTO's @IsEmpty() validator.
 */
@CommandHandler(CommentCreateCommand)
export class CommentCreateHandler implements ICommandHandler<CommentCreateCommand> {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {}

  async execute({ targetType, locale, slug, payload, meta }: CommentCreateCommand): Promise<Comment> {
    const verification = await this.commandBus.execute(
      new VerifyCaptchaChallengeCommand(payload.captchaChallengeId, payload.captchaAnswer, meta),
    );

    if (!verification.success) {
      throw new BadRequestException('Captcha verification failed.');
    }

    const ipAddressHash = meta.ip ? this.hashIp(meta.ip) : undefined;
    // Local/staging convenience only — see comments.autoApprove in config, defaults to false.
    const autoApprove = this.configService.get<boolean>('comments.autoApprove', false);
    const initialStatus = autoApprove ? CommentStatus.APPROVED : undefined;
    return this.commentRepository.createForSlug(targetType, locale, slug, payload, ipAddressHash, initialStatus);
  }

  // Local, self-contained hash — deliberately not reusing the captcha module's hashing
  // port to avoid a cross-module coupling beyond the CommandBus call above.
  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }
}

@CommandHandler(CommentUpdateStatusCommand)
export class CommentUpdateStatusHandler implements ICommandHandler<CommentUpdateStatusCommand> {
  constructor(private readonly commentRepository: CommentRepository) {}

  execute({ id, status }: CommentUpdateStatusCommand): Promise<Comment> {
    return this.commentRepository.updateStatus(id, status);
  }
}

@CommandHandler(CommentDeleteCommand)
export class CommentDeleteHandler implements ICommandHandler<CommentDeleteCommand> {
  constructor(private readonly commentRepository: CommentRepository) {}

  execute({ id }: CommentDeleteCommand): Promise<void> {
    return this.commentRepository.delete(id);
  }
}

export const CommentQueryHandlers = [CommentsGetApprovedBySlugHandler, CommentsGetAdminHandler, CommentGetByIdHandler];
export const CommentCommandHandlers = [CommentCreateHandler, CommentUpdateStatusHandler, CommentDeleteHandler];
