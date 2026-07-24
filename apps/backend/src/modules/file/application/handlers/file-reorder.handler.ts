import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FileRepository } from '../../domain/repositories';
import { FileReorderCommand } from '../commands/file-reorder.command';

@CommandHandler(FileReorderCommand)
export class FileReorderHandler implements ICommandHandler<FileReorderCommand> {
  constructor(private readonly repo: FileRepository) {}

  execute({ items }: FileReorderCommand): Promise<void> {
    return this.repo.reorder(items);
  }
}
