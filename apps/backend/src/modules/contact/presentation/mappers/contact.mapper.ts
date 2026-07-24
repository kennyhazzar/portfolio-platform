import { Contact } from '../../domain/entities/contact.entity';
import { ContactAdminDto, ContactDto } from '../dtos/contact.dto';

export class ContactMapper {
  static toDto(entity: Contact): ContactDto {
    return { id: entity.id, platform: entity.platform, value: entity.value, position: entity.position };
  }

  static toAdminDto(entity: Contact): ContactAdminDto {
    return { ...ContactMapper.toDto(entity), isVisible: entity.isVisible };
  }
}
