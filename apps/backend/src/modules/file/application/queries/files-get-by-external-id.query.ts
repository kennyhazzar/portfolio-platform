import { Query } from '@nestjs/cqrs';

import type { IdType } from '@/interfaces/id.type';
import { FileFrom } from '@/enums/file-from.enum';
import { File } from '../../domain/entities';

/** Files attached to one entity instance — backs FileUploadField/MediaGalleryField admin loading (docs/planning/05-admin-panel.md §1). */
export class FilesGetByExternalIdQuery extends Query<File[]> {
  constructor(
    public readonly module: FileFrom,
    public readonly externalId: IdType,
  ) {
    super();
  }
}
