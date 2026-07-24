import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Hero } from '../../domain/entities/hero.entity';
import { HeroRepository } from '../../domain/repositories/hero.repository';
import { HeroGetQuery } from '../queries/hero-get.query';

@QueryHandler(HeroGetQuery)
export class HeroGetHandler implements IQueryHandler<HeroGetQuery> {
  constructor(private readonly heroRepository: HeroRepository) {}

  execute(): Promise<Hero | null> {
    return this.heroRepository.get();
  }
}
