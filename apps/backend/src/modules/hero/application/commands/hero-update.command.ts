import { Command } from '@nestjs/cqrs';

import { Hero } from '../../domain/entities/hero.entity';
import { UpdateHeroBody } from '../../presentation/dtos/hero.dto';

export class HeroUpdateCommand extends Command<Hero> {
  constructor(public readonly payload: UpdateHeroBody) {
    super();
  }
}
