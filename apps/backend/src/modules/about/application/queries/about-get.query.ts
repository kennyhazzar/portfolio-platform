import { Query } from '@nestjs/cqrs';

import { About } from '../../domain/entities/about.entity';

export class AboutGetQuery extends Query<About | null> {
  constructor() {
    super();
  }
}
