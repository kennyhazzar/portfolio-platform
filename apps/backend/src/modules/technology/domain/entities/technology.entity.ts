import { IdType } from '@/interfaces/id.type';
import { TechnologyCategory } from '@/enums/technology-category.enum';

export class Technology {
  id!: IdType;
  name!: string;
  category!: TechnologyCategory;
  iconSlug?: string;
  position!: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Technology) {
    Object.assign(this, data);
  }
}
