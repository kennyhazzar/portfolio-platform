import { Command } from '@nestjs/cqrs';

import { ReorderItemBody } from '@/common/Reorder';
import { Locale } from '@/interfaces/locale.type';
import { Case } from '../../domain/entities/case.entity';
import { CreateCaseBody, UpdateCaseBody } from '../../presentation/dtos/case.dto';

export interface ViewMeta {
  ip?: string;
  userAgent?: string;
}

export class CaseCreateCommand extends Command<Case> {
  constructor(public readonly payload: CreateCaseBody) {
    super();
  }
}

export class CaseUpdateCommand extends Command<Case> {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateCaseBody,
  ) {
    super();
  }
}

export class CaseDeleteCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

export class CaseReorderCommand extends Command<void> {
  constructor(public readonly items: ReorderItemBody[]) {
    super();
  }
}

export class CaseRecordViewCommand extends Command<void> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
    public readonly meta: ViewMeta,
  ) {
    super();
  }
}
