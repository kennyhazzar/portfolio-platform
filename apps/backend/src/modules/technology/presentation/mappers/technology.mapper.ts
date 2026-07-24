import { Technology } from '../../domain/entities/technology.entity';
import { TechnologyDto } from '../dtos/technology.dto';

export class TechnologyMapper {
  static toDto(entity: Technology): TechnologyDto {
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      iconSlug: entity.iconSlug,
      position: entity.position,
    };
  }
}
