import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';
import { ContentStatus } from '@/enums/content-status.enum';

/** Not bilingual — a post is written once, in exactly one language (docs/planning/02-content-model.md §7). */
export class Post {
  id!: IdType;
  authorUserId!: IdType;
  status!: ContentStatus;
  publishedAt?: Date;
  viewCount!: number;
  locale!: Locale;
  title!: string;
  slug!: string;
  excerpt!: string;
  body!: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  constructor(data: Post) {
    Object.assign(this, data);
  }
}
