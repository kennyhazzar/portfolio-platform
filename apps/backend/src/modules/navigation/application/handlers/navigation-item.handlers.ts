import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { NavigationItem } from '../../domain/entities/navigation-item.entity';
import { NavigationItemRepository } from '../../domain/repositories/navigation-item.repository';
import {
  NavigationItemCreateCommand,
  NavigationItemDeleteCommand,
  NavigationItemReorderCommand,
  NavigationItemUpdateCommand,
} from '../commands/navigation-item.commands';
import { NavigationItemGetByIdQuery, NavigationItemsGetQuery } from '../queries/navigation-item.queries';

@QueryHandler(NavigationItemsGetQuery)
export class NavigationItemsGetHandler implements IQueryHandler<NavigationItemsGetQuery> {
  constructor(private readonly navigationItemRepository: NavigationItemRepository) {}

  execute({ visibleOnly }: NavigationItemsGetQuery): Promise<NavigationItem[]> {
    return this.navigationItemRepository.findAll(visibleOnly);
  }
}

@QueryHandler(NavigationItemGetByIdQuery)
export class NavigationItemGetByIdHandler implements IQueryHandler<NavigationItemGetByIdQuery> {
  constructor(private readonly navigationItemRepository: NavigationItemRepository) {}

  async execute({ id }: NavigationItemGetByIdQuery): Promise<NavigationItem> {
    const item = await this.navigationItemRepository.findById(id);
    if (!item) throw new NotFoundException(`Navigation item ${id} not found.`);
    return item;
  }
}

@CommandHandler(NavigationItemCreateCommand)
export class NavigationItemCreateHandler implements ICommandHandler<NavigationItemCreateCommand> {
  constructor(private readonly navigationItemRepository: NavigationItemRepository) {}

  execute({ payload }: NavigationItemCreateCommand): Promise<NavigationItem> {
    return this.navigationItemRepository.create(payload);
  }
}

@CommandHandler(NavigationItemUpdateCommand)
export class NavigationItemUpdateHandler implements ICommandHandler<NavigationItemUpdateCommand> {
  constructor(private readonly navigationItemRepository: NavigationItemRepository) {}

  execute({ id, payload }: NavigationItemUpdateCommand): Promise<NavigationItem> {
    return this.navigationItemRepository.update(id, payload);
  }
}

@CommandHandler(NavigationItemDeleteCommand)
export class NavigationItemDeleteHandler implements ICommandHandler<NavigationItemDeleteCommand> {
  constructor(private readonly navigationItemRepository: NavigationItemRepository) {}

  execute({ id }: NavigationItemDeleteCommand): Promise<void> {
    return this.navigationItemRepository.delete(id);
  }
}

@CommandHandler(NavigationItemReorderCommand)
export class NavigationItemReorderHandler implements ICommandHandler<NavigationItemReorderCommand> {
  constructor(private readonly navigationItemRepository: NavigationItemRepository) {}

  execute({ items }: NavigationItemReorderCommand): Promise<void> {
    return this.navigationItemRepository.reorder(items);
  }
}

export const NavigationItemQueryHandlers = [NavigationItemsGetHandler, NavigationItemGetByIdHandler];
export const NavigationItemCommandHandlers = [
  NavigationItemCreateHandler,
  NavigationItemUpdateHandler,
  NavigationItemDeleteHandler,
  NavigationItemReorderHandler,
];
