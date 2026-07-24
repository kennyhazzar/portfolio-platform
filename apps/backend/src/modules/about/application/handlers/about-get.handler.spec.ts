import { AboutGetHandler } from './about-get.handler';
import { AboutRepository } from '../../domain/repositories/about.repository';
import { About } from '../../domain/entities/about.entity';

describe('AboutGetHandler', () => {
  it('returns whatever the repository resolves, including null', async () => {
    const repository: jest.Mocked<AboutRepository> = {
      get: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    const handler = new AboutGetHandler(repository);

    await expect(handler.execute()).resolves.toBeNull();

    const about = new About({ id: 'about-id', translations: {} });
    repository.get.mockResolvedValue(about);
    await expect(handler.execute()).resolves.toBe(about);
  });
});
