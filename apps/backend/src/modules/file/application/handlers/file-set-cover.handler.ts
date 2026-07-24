import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FileRepository } from '../../domain/repositories';
import { FileSetCoverCommand } from '../commands/file-set-cover.command';

@CommandHandler(FileSetCoverCommand)
export class FileSetCoverHandler implements ICommandHandler<FileSetCoverCommand> {
  constructor(private readonly repo: FileRepository) {}

  execute({ id }: FileSetCoverCommand): Promise<void> {
    return this.repo.setCover(id);
  }
}
