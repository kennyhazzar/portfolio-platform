import { Command } from '@nestjs/cqrs';

import { ReorderItemBody } from '@/common/Reorder';
import { NavigationItem } from '../../domain/entities/navigation-item.entity';
import { CreateNavigationItemBody, UpdateNavigationItemBody } from '../../presentation/dtos/navigation-item.dto';

export class NavigationItemCreateCommand extends Command<NavigationItem> {
  constructor(public readonly payload: CreateNavigationItemBody) {
    super();
  }
}

export class NavigationItemUpdateCommand extends Command<NavigationItem> {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateNavigationItemBody,
  ) {
    super();
  }
}

export class NavigationItemDeleteCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

export class NavigationItemReorderCommand extends Command<void> {
  constructor(public readonly items: ReorderItemBody[]) {
    super();
  }
}
