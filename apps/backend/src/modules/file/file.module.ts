import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { S3Module } from 'nestjs-s3';

import { S3ModuleFuncOptions } from '@/options/s3.module.options';

import {
  FileGetByIdHandler,
  FilesGetHandler,
  FilesGetByExternalIdHandler,
  FilesUploadHandler,
  FileDownloadHandler,
  FileUpdateHandler,
  FileDeleteHandler,
  FileReorderHandler,
  FileSetCoverHandler,
} from './application';
import { FileRepository } from './domain/repositories';
import { FileAdapter } from './infrastructure/adapters/s3.adapter';
import { FileRepositoryDrizzle } from './infrastructure/repositories/file.repository.drizzle';
import { FileController } from './presentation/controllers/file.controller';
import { FileAdminController } from './presentation/controllers/file-admin.controller';
import { UsersModule } from '../users/users.module';

const CommandHandlers = [
  FilesUploadHandler,
  FileDownloadHandler,
  FileUpdateHandler,
  FileDeleteHandler,
  FileReorderHandler,
  FileSetCoverHandler,
];
const QueryHandlers = [FilesGetHandler, FileGetByIdHandler, FilesGetByExternalIdHandler];

@Global()
@Module({
  imports: [
    S3Module.forRootAsync({ useFactory: S3ModuleFuncOptions, inject: [ConfigService] }),
    CqrsModule,
    UsersModule,
  ],
  controllers: [FileController, FileAdminController],
  providers: [
    FileAdapter,
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: FileRepository,
      useClass: FileRepositoryDrizzle,
    },
  ],
  exports: [FileRepository, FileAdapter],
})
export class FileModule {}
