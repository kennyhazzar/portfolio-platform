import { ReorderItemBody } from '@/common/Reorder';
import { PaginatedResult } from '@/common/Paginated';
import { Technology } from '../entities/technology.entity';
import {
  CreateTechnologyBody,
  ImportResultDto,
  ImportTechnologyItemBody,
  UpdateTechnologyBody,
} from '../../presentation/dtos/technology.dto';

export abstract class TechnologyRepository {
  abstract findAll(page: number, perPage: number): Promise<PaginatedResult<Technology>>;
  abstract findById(id: string): Promise<Technology | null>;
  abstract create(body: CreateTechnologyBody): Promise<Technology>;
  abstract update(id: string, body: UpdateTechnologyBody): Promise<Technology>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(items: ReorderItemBody[]): Promise<void>;
  abstract importMany(items: ImportTechnologyItemBody[]): Promise<ImportResultDto>;
}
