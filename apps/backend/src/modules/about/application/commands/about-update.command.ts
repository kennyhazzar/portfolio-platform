import { Command } from '@nestjs/cqrs';

import { About } from '../../domain/entities/about.entity';
import { UpdateAboutBody } from '../../presentation/dtos/about.dto';

export class AboutUpdateCommand extends Command<About> {
  constructor(public readonly payload: UpdateAboutBody) {
    super();
  }
}
