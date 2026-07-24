import { Command } from '@nestjs/cqrs';

import { ReorderItemBody } from '@/common/Reorder';

/** Bulk gallery reorder for MediaGalleryField — docs/planning/05-admin-panel.md §1/§2. */
export class FileReorderCommand extends Command<void> {
  constructor(public readonly items: ReorderItemBody[]) {
    super();
  }
}
