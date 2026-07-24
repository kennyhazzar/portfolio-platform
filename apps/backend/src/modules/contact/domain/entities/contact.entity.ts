import { IdType } from '@/interfaces/id.type';
import { ContactPlatform } from '@/enums/contact-platform.enum';

export class Contact {
  id!: IdType;
  platform!: ContactPlatform;
  value!: string;
  position!: number;
  isVisible!: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Contact) {
    Object.assign(this, data);
  }
}
