import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { Technology } from '../../domain/entities/technology.entity';
import { TechnologyRepository } from '../../domain/repositories/technology.repository';
import {
  TechnologyCreateCommand,
  TechnologyDeleteCommand,
  TechnologyReorderCommand,
  TechnologyUpdateCommand,
} from '../commands/technology.commands';
import { TechnologiesGetQuery, TechnologyGetByIdQuery } from '../queries/technology.queries';

@QueryHandler(TechnologiesGetQuery)
export class TechnologiesGetHandler implements IQueryHandler<TechnologiesGetQuery> {
  constructor(private readonly technologyRepository: TechnologyRepository) {}

  execute({ page, perPage }: TechnologiesGetQuery): Promise<PaginatedResult<Technology>> {
    return this.technologyRepository.findAll(page, perPage);
  }
}

@QueryHandler(TechnologyGetByIdQuery)
export class TechnologyGetByIdHandler implements IQueryHandler<TechnologyGetByIdQuery> {
  constructor(private readonly technologyRepository: TechnologyRepository) {}

  async execute({ id }: TechnologyGetByIdQuery): Promise<Technology> {
    const technology = await this.technologyRepository.findById(id);
    if (!technology) throw new NotFoundException(`Technology ${id} not found.`);
    return technology;
  }
}

@CommandHandler(TechnologyCreateCommand)
export class TechnologyCreateHandler implements ICommandHandler<TechnologyCreateCommand> {
  constructor(private readonly technologyRepository: TechnologyRepository) {}

  execute({ payload }: TechnologyCreateCommand): Promise<Technology> {
    return this.technologyRepository.create(payload);
  }
}

@CommandHandler(TechnologyUpdateCommand)
export class TechnologyUpdateHandler implements ICommandHandler<TechnologyUpdateCommand> {
  constructor(private readonly technologyRepository: TechnologyRepository) {}

  execute({ id, payload }: TechnologyUpdateCommand): Promise<Technology> {
    return this.technologyRepository.update(id, payload);
  }
}

@CommandHandler(TechnologyDeleteCommand)
export class TechnologyDeleteHandler implements ICommandHandler<TechnologyDeleteCommand> {
  constructor(private readonly technologyRepository: TechnologyRepository) {}

  execute({ id }: TechnologyDeleteCommand): Promise<void> {
    return this.technologyRepository.delete(id);
  }
}

@CommandHandler(TechnologyReorderCommand)
export class TechnologyReorderHandler implements ICommandHandler<TechnologyReorderCommand> {
  constructor(private readonly technologyRepository: TechnologyRepository) {}

  execute({ items }: TechnologyReorderCommand): Promise<void> {
    return this.technologyRepository.reorder(items);
  }
}

export const TechnologyQueryHandlers = [TechnologiesGetHandler, TechnologyGetByIdHandler];
export const TechnologyCommandHandlers = [
  TechnologyCreateHandler,
  TechnologyUpdateHandler,
  TechnologyDeleteHandler,
  TechnologyReorderHandler,
];
