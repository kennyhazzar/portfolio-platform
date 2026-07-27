import { PaginatedResult } from '@/common/Paginated';
import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';
import { Post } from '../entities/post.entity';
import { CreatePostBody, ImportPostItemBody, ImportResultDto, UpdatePostBody } from '../../presentation/dtos/post.dto';

export abstract class PostRepository {
  /** Not bilingual — filters by locale directly, unlike Case (docs/planning/02-content-model.md §7). */
  abstract findPublished(locale: Locale, page: number, perPage: number): Promise<PaginatedResult<Post>>;
  abstract findPublishedBySlug(locale: Locale, slug: string): Promise<Post | null>;
  /** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
  abstract findBySlug(locale: Locale, slug: string): Promise<Post | null>;
  abstract findAllAdmin(page: number, perPage: number): Promise<PaginatedResult<Post>>;
  abstract findById(id: string): Promise<Post | null>;
  abstract create(authorUserId: IdType, body: CreatePostBody): Promise<Post>;
  abstract update(id: string, body: UpdatePostBody): Promise<Post>;
  abstract delete(id: string): Promise<void>;
  abstract incrementViewCount(id: string): Promise<void>;
  abstract importMany(authorUserId: IdType, items: ImportPostItemBody[]): Promise<ImportResultDto>;
}
