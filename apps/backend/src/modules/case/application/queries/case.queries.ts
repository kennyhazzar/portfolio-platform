import { Query } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { Locale } from '@/interfaces/locale.type';
import { Case } from '../../domain/entities/case.entity';

export class CasesGetPublishedQuery extends Query<PaginatedResult<Case>> {
  constructor(
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class CaseGetPublishedBySlugQuery extends Query<Case> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
  ) {
    super();
  }
}

export class CasesGetAdminQuery extends Query<PaginatedResult<Case>> {
  constructor(
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class CaseGetByIdQuery extends Query<Case> {
  constructor(public readonly id: string) {
    super();
  }
}

/** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
export class CaseGetBySlugAnyStatusQuery extends Query<Case> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
  ) {
    super();
  }
}
