import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { About } from '../../domain/entities/about.entity';
import { AboutRepository } from '../../domain/repositories/about.repository';
import { AboutGetQuery } from '../queries/about-get.query';

@QueryHandler(AboutGetQuery)
export class AboutGetHandler implements IQueryHandler<AboutGetQuery> {
  constructor(private readonly aboutRepository: AboutRepository) {}

  execute(): Promise<About | null> {
    return this.aboutRepository.get();
  }
}
