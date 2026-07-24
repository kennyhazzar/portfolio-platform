import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { About } from '../../domain/entities/about.entity';
import { AboutRepository } from '../../domain/repositories/about.repository';
import { AboutUpdateCommand } from '../commands/about-update.command';

@CommandHandler(AboutUpdateCommand)
export class AboutUpdateHandler implements ICommandHandler<AboutUpdateCommand> {
  constructor(private readonly aboutRepository: AboutRepository) {}

  execute({ payload }: AboutUpdateCommand): Promise<About> {
    return this.aboutRepository.update(payload);
  }
}
