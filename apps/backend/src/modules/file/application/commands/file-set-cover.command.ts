import { Command } from '@nestjs/cqrs';

import type { IdType } from '@/interfaces/id.type';

/** Marks one gallery file as the cover, unsetting any previous cover for the same entity — MediaGalleryField's "set as cover" control (docs/planning/05-admin-panel.md §1). */
export class FileSetCoverCommand extends Command<void> {
  constructor(public readonly id: IdType) {
    super();
  }
}
