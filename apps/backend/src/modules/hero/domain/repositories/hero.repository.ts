import { Hero } from '../entities/hero.entity';
import { UpdateHeroBody } from '../../presentation/dtos/hero.dto';

export abstract class HeroRepository {
  abstract get(): Promise<Hero | null>;
  abstract update(update: UpdateHeroBody): Promise<Hero>;
}
