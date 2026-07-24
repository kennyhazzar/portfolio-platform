import { ReorderItemBody } from '@/common/Reorder';
import { Contact } from '../entities/contact.entity';
import { CreateContactBody, UpdateContactBody } from '../../presentation/dtos/contact.dto';

export abstract class ContactRepository {
  abstract findAll(visibleOnly: boolean): Promise<Contact[]>;
  abstract findById(id: string): Promise<Contact | null>;
  abstract create(body: CreateContactBody): Promise<Contact>;
  abstract update(id: string, body: UpdateContactBody): Promise<Contact>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(items: ReorderItemBody[]): Promise<void>;
}
