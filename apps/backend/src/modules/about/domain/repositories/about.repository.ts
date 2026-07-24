import { About } from '../entities/about.entity';
import { UpdateAboutBody } from '../../presentation/dtos/about.dto';

export abstract class AboutRepository {
  abstract get(): Promise<About | null>;
  abstract update(update: UpdateAboutBody): Promise<About>;
}
