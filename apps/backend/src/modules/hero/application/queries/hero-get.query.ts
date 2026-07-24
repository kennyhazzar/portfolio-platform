import { Query } from '@nestjs/cqrs';

import { Hero } from '../../domain/entities/hero.entity';

export class HeroGetQuery extends Query<Hero | null> {
  constructor() {
    super();
  }
}
