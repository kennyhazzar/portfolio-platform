import { AboutUpdateHandler } from './about-update.handler';
import { AboutRepository } from '../../domain/repositories/about.repository';
import { AboutUpdateCommand } from '../commands/about-update.command';
import { About } from '../../domain/entities/about.entity';
import { UpdateAboutBody } from '../../presentation/dtos/about.dto';

describe('AboutUpdateHandler', () => {
  it('delegates the update to the repository and returns the updated entity', async () => {
    const updated = new About({
      id: 'about-id',
      translations: { ru: { locale: 'ru', bio: 'Био' }, en: { locale: 'en', bio: 'Bio' } },
    });
    const repository: jest.Mocked<AboutRepository> = {
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(updated),
    };
    const handler = new AboutUpdateHandler(repository);
    const payload: UpdateAboutBody = { ru: { bio: 'Био' }, en: { bio: 'Bio' } };

    const result = await handler.execute(new AboutUpdateCommand(payload));

    expect(repository.update).toHaveBeenCalledWith(payload);
    expect(result).toBe(updated);
  });
});
