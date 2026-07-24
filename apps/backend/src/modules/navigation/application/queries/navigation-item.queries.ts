import { Query } from '@nestjs/cqrs';

import { NavigationItem } from '../../domain/entities/navigation-item.entity';

export class NavigationItemsGetQuery extends Query<NavigationItem[]> {
  constructor(public readonly visibleOnly: boolean) {
    super();
  }
}

export class NavigationItemGetByIdQuery extends Query<NavigationItem> {
  constructor(public readonly id: string) {
    super();
  }
}
