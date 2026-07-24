import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { File } from '../../domain/entities';
import { FileRepository } from '../../domain/repositories';
import { FilesGetByExternalIdQuery } from '../queries/files-get-by-external-id.query';

@QueryHandler(FilesGetByExternalIdQuery)
export class FilesGetByExternalIdHandler implements IQueryHandler<FilesGetByExternalIdQuery> {
  constructor(private readonly repo: FileRepository) {}

  execute({ module, externalId }: FilesGetByExternalIdQuery): Promise<File[]> {
    return this.repo.findByModuleAndExternalId(module, externalId);
  }
}
