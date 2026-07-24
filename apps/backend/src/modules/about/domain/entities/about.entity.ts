import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';

export interface AboutTranslation {
  locale: Locale;
  bio: string;
}

export class About {
  id!: IdType;
  translations!: Partial<Record<Locale, AboutTranslation>>;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: About) {
    Object.assign(this, data);
  }
}
