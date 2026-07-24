import { HeroGetHandler } from './hero-get.handler';
import { HeroRepository } from '../../domain/repositories/hero.repository';
import { Hero } from '../../domain/entities/hero.entity';

describe('HeroGetHandler', () => {
  it('returns whatever the repository resolves, including null', async () => {
    const repository: jest.Mocked<HeroRepository> = {
      get: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    const handler = new HeroGetHandler(repository);

    await expect(handler.execute()).resolves.toBeNull();

    const hero = new Hero({ id: 'hero-id', translations: {} });
    repository.get.mockResolvedValue(hero);
    await expect(handler.execute()).resolves.toBe(hero);
    expect(repository.get).toHaveBeenCalledTimes(2);
  });
});
