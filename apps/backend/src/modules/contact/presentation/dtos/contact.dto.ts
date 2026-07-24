import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ContactPlatform } from '@/enums/contact-platform.enum';

export class ContactDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ContactPlatform })
  platform!: ContactPlatform;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  position!: number;
}

/** Admin shape adds isVisible — the public list only ever returns visible contacts already. */
export class ContactAdminDto extends ContactDto {
  @ApiProperty()
  isVisible!: boolean;
}

export class CreateContactBody {
  @ApiProperty({ enum: ContactPlatform })
  @IsEnum(ContactPlatform)
  platform!: ContactPlatform;

  @ApiProperty({ description: 'URL, handle, or email address' })
  @IsString()
  value!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateContactBody {
  @ApiPropertyOptional({ enum: ContactPlatform })
  @IsOptional()
  @IsEnum(ContactPlatform)
  platform?: ContactPlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
