import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Hero } from '../../domain/entities/hero.entity';
import { HeroRepository } from '../../domain/repositories/hero.repository';
import { HeroUpdateCommand } from '../commands/hero-update.command';

@CommandHandler(HeroUpdateCommand)
export class HeroUpdateHandler implements ICommandHandler<HeroUpdateCommand> {
  constructor(private readonly heroRepository: HeroRepository) {}

  execute({ payload }: HeroUpdateCommand): Promise<Hero> {
    return this.heroRepository.update(payload);
  }
}
