import { IdType } from '@/interfaces/id.type';
import { FileFrom } from '@/enums/file-from.enum';
import { FileType } from '@/enums/file-type.enum';
import { FileVersion } from './file-version.entity';

export class File {
  id!: IdType;
  name!: string;
  path!: string;
  module!: FileFrom;
  externalId!: IdType;
  description?: string;
  type!: FileType;
  lastVersion?: FileVersion;
  lastVersionId?: IdType;
  versions?: FileVersion[];
  userId!: IdType;
  /** Ordering for galleries of more than one file per (module, externalId) — docs/planning/02-content-model.md §1. */
  position!: number;
  /** Marks the cover/thumbnail file for its (module, externalId) — docs/planning/02-content-model.md §1. */
  isCover!: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  constructor(data: File) {
    Object.assign(this, data);
  }
}
