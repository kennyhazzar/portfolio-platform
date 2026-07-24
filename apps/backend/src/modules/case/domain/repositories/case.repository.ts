import { PaginatedResult } from '@/common/Paginated';
import { ReorderItemBody } from '@/common/Reorder';
import { Locale } from '@/interfaces/locale.type';
import { Case } from '../entities/case.entity';
import { CreateCaseBody, UpdateCaseBody } from '../../presentation/dtos/case.dto';

export abstract class CaseRepository {
  abstract findPublished(page: number, perPage: number): Promise<PaginatedResult<Case>>;
  abstract findPublishedBySlug(locale: Locale, slug: string): Promise<Case | null>;
  /** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
  abstract findBySlug(locale: Locale, slug: string): Promise<Case | null>;
  abstract findAllAdmin(page: number, perPage: number): Promise<PaginatedResult<Case>>;
  abstract findById(id: string): Promise<Case | null>;
  abstract create(body: CreateCaseBody): Promise<Case>;
  abstract update(id: string, body: UpdateCaseBody): Promise<Case>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(items: ReorderItemBody[]): Promise<void>;
  abstract incrementViewCount(id: string): Promise<void>;
}
