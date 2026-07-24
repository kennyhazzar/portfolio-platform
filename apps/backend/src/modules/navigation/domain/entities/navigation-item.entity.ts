import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';

export interface NavigationItemTranslation {
  locale: Locale;
  label: string;
}

export class NavigationItem {
  id!: IdType;
  parentId?: IdType;
  url!: string;
  position!: number;
  isVisible!: boolean;
  translations!: Partial<Record<Locale, NavigationItemTranslation>>;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: NavigationItem) {
    Object.assign(this, data);
  }
}
