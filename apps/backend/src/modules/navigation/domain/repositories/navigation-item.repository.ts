import { ReorderItemBody } from '@/common/Reorder';
import { NavigationItem } from '../entities/navigation-item.entity';
import { CreateNavigationItemBody, UpdateNavigationItemBody } from '../../presentation/dtos/navigation-item.dto';

export abstract class NavigationItemRepository {
  abstract findAll(visibleOnly: boolean): Promise<NavigationItem[]>;
  abstract findById(id: string): Promise<NavigationItem | null>;
  abstract create(body: CreateNavigationItemBody): Promise<NavigationItem>;
  abstract update(id: string, body: UpdateNavigationItemBody): Promise<NavigationItem>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(items: ReorderItemBody[]): Promise<void>;
}
