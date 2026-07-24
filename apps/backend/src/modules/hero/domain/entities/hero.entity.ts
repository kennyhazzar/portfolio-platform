import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';

export interface HeroTranslation {
  locale: Locale;
  name: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
}

export class Hero {
  id!: IdType;
  ctaUrl?: string;
  translations!: Partial<Record<Locale, HeroTranslation>>;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Hero) {
    Object.assign(this, data);
  }
}
