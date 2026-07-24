import { HeroUpdateHandler } from './hero-update.handler';
import { HeroRepository } from '../../domain/repositories/hero.repository';
import { HeroUpdateCommand } from '../commands/hero-update.command';
import { Hero } from '../../domain/entities/hero.entity';
import { UpdateHeroBody } from '../../presentation/dtos/hero.dto';

describe('HeroUpdateHandler', () => {
  it('delegates the update to the repository and returns the updated entity', async () => {
    const updated = new Hero({
      id: 'hero-id',
      translations: { ru: { locale: 'ru', name: 'Имя' }, en: { locale: 'en', name: 'Name' } },
    });
    const repository: jest.Mocked<HeroRepository> = {
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(updated),
    };
    const handler = new HeroUpdateHandler(repository);
    const payload: UpdateHeroBody = { ru: { name: 'Имя' }, en: { name: 'Name' } };

    const result = await handler.execute(new HeroUpdateCommand(payload));

    expect(repository.update).toHaveBeenCalledWith(payload);
    expect(result).toBe(updated);
  });
});
