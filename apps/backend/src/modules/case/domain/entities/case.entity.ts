import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';
import { ContentStatus } from '@/enums/content-status.enum';
import { TechnologyCategory } from '@/enums/technology-category.enum';

export interface CaseTranslation {
  locale: Locale;
  title: string;
  slug: string;
  summary: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CaseTechnologyRef {
  id: string;
  name: string;
  category: TechnologyCategory;
  iconSlug?: string;
}

export class Case {
  id!: IdType;
  status!: ContentStatus;
  publishedAt?: Date;
  position!: number;
  repoUrl?: string;
  liveUrl?: string;
  viewCount!: number;
  technologies!: CaseTechnologyRef[];
  translations!: Partial<Record<Locale, CaseTranslation>>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  constructor(data: Case) {
    Object.assign(this, data);
  }
}
