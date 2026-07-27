import { Command } from '@nestjs/cqrs';

import { ReorderItemBody } from '@/common/Reorder';
import { Technology } from '../../domain/entities/technology.entity';
import {
  CreateTechnologyBody,
  ImportResultDto,
  ImportTechnologyItemBody,
  UpdateTechnologyBody,
} from '../../presentation/dtos/technology.dto';

export class TechnologyCreateCommand extends Command<Technology> {
  constructor(public readonly payload: CreateTechnologyBody) {
    super();
  }
}

export class TechnologyUpdateCommand extends Command<Technology> {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateTechnologyBody,
  ) {
    super();
  }
}

export class TechnologyDeleteCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

export class TechnologyReorderCommand extends Command<void> {
  constructor(public readonly items: ReorderItemBody[]) {
    super();
  }
}

export class TechnologiesImportCommand extends Command<ImportResultDto> {
  constructor(public readonly items: ImportTechnologyItemBody[]) {
    super();
  }
}
