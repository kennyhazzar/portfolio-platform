import { createHash } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { ViewTrackingService } from '@/common/view-tracking/view-tracking.service';
import { FileRepository } from '@/modules/file/domain/repositories';
import { Case } from '../../domain/entities/case.entity';
import { CaseRepository } from '../../domain/repositories/case.repository';
import {
  CaseCreateCommand,
  CaseDeleteCommand,
  CaseRecordViewCommand,
  CaseReorderCommand,
  CaseUpdateCommand,
} from '../commands/case.commands';
import {
  CaseGetByIdQuery,
  CaseGetBySlugAnyStatusQuery,
  CaseGetPublishedBySlugQuery,
  CasesGetAdminQuery,
  CasesGetPublishedQuery,
} from '../queries/case.queries';

@QueryHandler(CasesGetPublishedQuery)
export class CasesGetPublishedHandler implements IQueryHandler<CasesGetPublishedQuery> {
  constructor(private readonly caseRepository: CaseRepository) {}

  execute({ page, perPage }: CasesGetPublishedQuery): Promise<PaginatedResult<Case>> {
    return this.caseRepository.findPublished(page, perPage);
  }
}

@QueryHandler(CaseGetPublishedBySlugQuery)
export class CaseGetPublishedBySlugHandler implements IQueryHandler<CaseGetPublishedBySlugQuery> {
  constructor(private readonly caseRepository: CaseRepository) {}

  async execute({ locale, slug }: CaseGetPublishedBySlugQuery): Promise<Case> {
    const found = await this.caseRepository.findPublishedBySlug(locale, slug);
    if (!found) throw new NotFoundException(`Case ${slug} not found.`);
    return found;
  }
}

/** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
@QueryHandler(CaseGetBySlugAnyStatusQuery)
export class CaseGetBySlugAnyStatusHandler implements IQueryHandler<CaseGetBySlugAnyStatusQuery> {
  constructor(private readonly caseRepository: CaseRepository) {}

  async execute({ locale, slug }: CaseGetBySlugAnyStatusQuery): Promise<Case> {
    const found = await this.caseRepository.findBySlug(locale, slug);
    if (!found) throw new NotFoundException(`Case ${slug} not found.`);
    return found;
  }
}

@QueryHandler(CasesGetAdminQuery)
export class CasesGetAdminHandler implements IQueryHandler<CasesGetAdminQuery> {
  constructor(private readonly caseRepository: CaseRepository) {}

  execute({ page, perPage }: CasesGetAdminQuery): Promise<PaginatedResult<Case>> {
    return this.caseRepository.findAllAdmin(page, perPage);
  }
}

@QueryHandler(CaseGetByIdQuery)
export class CaseGetByIdHandler implements IQueryHandler<CaseGetByIdQuery> {
  constructor(private readonly caseRepository: CaseRepository) {}

  async execute({ id }: CaseGetByIdQuery): Promise<Case> {
    const found = await this.caseRepository.findById(id);
    if (!found) throw new NotFoundException(`Case ${id} not found.`);
    return found;
  }
}

@CommandHandler(CaseCreateCommand)
export class CaseCreateHandler implements ICommandHandler<CaseCreateCommand> {
  constructor(private readonly caseRepository: CaseRepository) {}

  execute({ payload }: CaseCreateCommand): Promise<Case> {
    return this.caseRepository.create(payload);
  }
}

@CommandHandler(CaseUpdateCommand)
export class CaseUpdateHandler implements ICommandHandler<CaseUpdateCommand> {
  constructor(private readonly caseRepository: CaseRepository) {}

  execute({ id, payload }: CaseUpdateCommand): Promise<Case> {
    return this.caseRepository.update(id, payload);
  }
}

/** Also cleans up the case's attached files (cover/gallery) to avoid orphan rows — docs/planning/02-content-model.md §1. */
@CommandHandler(CaseDeleteCommand)
export class CaseDeleteHandler implements ICommandHandler<CaseDeleteCommand> {
  constructor(
    private readonly caseRepository: CaseRepository,
    private readonly fileRepository: FileRepository,
  ) {}

  async execute({ id }: CaseDeleteCommand): Promise<void> {
    await this.caseRepository.delete(id);
    await this.fileRepository.deleteByExternalId(id);
  }
}

@CommandHandler(CaseReorderCommand)
export class CaseReorderHandler implements ICommandHandler<CaseReorderCommand> {
  constructor(private readonly caseRepository: CaseRepository) {}

  execute({ items }: CaseReorderCommand): Promise<void> {
    return this.caseRepository.reorder(items);
  }
}

/**
 * Redis-deduped view counter (docs/planning/02-content-model.md §9) — a visitor only bumps
 * viewCount once per case within the dedup window, regardless of how many times they reload.
 */
@CommandHandler(CaseRecordViewCommand)
export class CaseRecordViewHandler implements ICommandHandler<CaseRecordViewCommand> {
  constructor(
    private readonly caseRepository: CaseRepository,
    private readonly viewTrackingService: ViewTrackingService,
  ) {}

  async execute({ locale, slug, meta }: CaseRecordViewCommand): Promise<void> {
    const found = await this.caseRepository.findPublishedBySlug(locale, slug);
    if (!found) throw new NotFoundException(`Case ${slug} not found.`);

    const visitorHash = createHash('sha256')
      .update(`${meta.ip ?? ''}:${meta.userAgent ?? ''}`)
      .digest('hex');
    const shouldCount = await this.viewTrackingService.shouldCountView('case', found.id, visitorHash);
    if (shouldCount) {
      await this.caseRepository.incrementViewCount(found.id);
    }
  }
}

export const CaseQueryHandlers = [
  CasesGetPublishedHandler,
  CaseGetPublishedBySlugHandler,
  CaseGetBySlugAnyStatusHandler,
  CasesGetAdminHandler,
  CaseGetByIdHandler,
];
export const CaseCommandHandlers = [
  CaseCreateHandler,
  CaseUpdateHandler,
  CaseDeleteHandler,
  CaseReorderHandler,
  CaseRecordViewHandler,
];
