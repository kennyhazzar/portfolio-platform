import { BadRequestException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { CommentCreateHandler, CommentUpdateStatusHandler } from './comment.handlers';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentCreateCommand } from '../commands/comment.commands';
import { CommentStatus } from '@/enums/comment-status.enum';
import { Comment } from '../../domain/entities/comment.entity';
import { CreateCommentBody } from '../../presentation/dtos/comment.dto';

describe('Comment handlers', () => {
  const created = new Comment({
    id: 'comment-id',
    postId: 'post-id',
    authorName: 'Reader',
    body: 'Nice post!',
    status: CommentStatus.PENDING,
    locale: 'ru',
  });

  const payload: CreateCommentBody = {
    authorName: 'Reader',
    body: 'Nice post!',
    captchaChallengeId: 'challenge-id',
    captchaAnswer: '1234',
  };

  function mockRepository(): jest.Mocked<CommentRepository> {
    return {
      findApprovedByPostSlug: jest.fn(),
      findAllAdmin: jest.fn(),
      findById: jest.fn(),
      createForSlug: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    };
  }

  function mockCommandBus(result: { success: boolean; attemptsLeft: number }): jest.Mocked<CommandBus> {
    return { execute: jest.fn().mockResolvedValue(result) };
  }

  function mockConfigService(autoApprove = false): jest.Mocked<ConfigService> {
    return { get: jest.fn().mockReturnValue(autoApprove) } as unknown as jest.Mocked<ConfigService>;
  }

  it('CommentCreateHandler creates the comment only after the captcha verification succeeds', async () => {
    const repository = mockRepository();
    repository.createForSlug.mockResolvedValue(created);
    const commandBus = mockCommandBus({ success: true, attemptsLeft: 0 });
    const handler = new CommentCreateHandler(repository, commandBus, mockConfigService());

    const result = await handler.execute(new CommentCreateCommand('ru', 'moi-post', payload, { ip: '1.2.3.4' }));

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'challenge-id', answer: '1234' }),
    );
    expect(repository.createForSlug).toHaveBeenCalledWith(
      'ru',
      'moi-post',
      payload,
      expect.any(String), // hashed IP, not the raw address
      undefined, // autoApprove disabled — default PENDING status from the schema
    );
    expect(result).toBe(created);
  });

  it('CommentCreateHandler passes an APPROVED initial status when comments.autoApprove is on', async () => {
    const repository = mockRepository();
    repository.createForSlug.mockResolvedValue(created);
    const commandBus = mockCommandBus({ success: true, attemptsLeft: 0 });
    const handler = new CommentCreateHandler(repository, commandBus, mockConfigService(true));

    await handler.execute(new CommentCreateCommand('ru', 'moi-post', payload, { ip: '1.2.3.4' }));

    expect(repository.createForSlug).toHaveBeenCalledWith(
      'ru',
      'moi-post',
      payload,
      expect.any(String),
      CommentStatus.APPROVED,
    );
  });

  it('CommentCreateHandler rejects the comment when the captcha verification fails', async () => {
    const repository = mockRepository();
    const commandBus = mockCommandBus({ success: false, attemptsLeft: 1 });
    const handler = new CommentCreateHandler(repository, commandBus, mockConfigService());

    await expect(handler.execute(new CommentCreateCommand('ru', 'moi-post', payload, {}))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.createForSlug).not.toHaveBeenCalled();
  });

  it('CommentUpdateStatusHandler delegates to updateStatus for moderation (approve/reject/spam)', async () => {
    const repository = mockRepository();
    repository.updateStatus.mockResolvedValue({ ...created, status: CommentStatus.APPROVED });
    const handler = new CommentUpdateStatusHandler(repository);

    await handler.execute({ id: 'comment-id', status: CommentStatus.APPROVED });

    expect(repository.updateStatus).toHaveBeenCalledWith('comment-id', CommentStatus.APPROVED);
  });
});
