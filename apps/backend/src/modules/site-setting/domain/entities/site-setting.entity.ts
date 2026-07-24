import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';

export interface SiteSettingTranslation {
  locale: Locale;
  title: string;
  brandName?: string;
  description: string;
  footerText?: string;
  copyrightText?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
}

export class SiteSetting {
  id!: IdType;
  translations!: Partial<Record<Locale, SiteSettingTranslation>>;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: SiteSetting) {
    Object.assign(this, data);
  }
}
