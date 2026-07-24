import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { TechnologyCategory } from '@/enums/technology-category.enum';
import { Paginated } from '@/common/Paginated';

export class TechnologyDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: TechnologyCategory })
  category!: TechnologyCategory;

  @ApiPropertyOptional()
  iconSlug?: string;

  @ApiProperty()
  position!: number;
}

export class TechnologiesDto extends Paginated(TechnologyDto) {}

export class CreateTechnologyBody {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: TechnologyCategory, default: TechnologyCategory.OTHER })
  @IsOptional()
  @IsEnum(TechnologyCategory)
  category?: TechnologyCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconSlug?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateTechnologyBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TechnologyCategory })
  @IsOptional()
  @IsEnum(TechnologyCategory)
  category?: TechnologyCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconSlug?: string;
}
