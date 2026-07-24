import { Query } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { Technology } from '../../domain/entities/technology.entity';

export class TechnologiesGetQuery extends Query<PaginatedResult<Technology>> {
  constructor(
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class TechnologyGetByIdQuery extends Query<Technology> {
  constructor(public readonly id: string) {
    super();
  }
}
