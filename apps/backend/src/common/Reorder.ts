import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, ValidateNested } from 'class-validator';

/**
 * Shared bulk-reorder request shape, reused by every orderable collection
 * (Technology, Navigation, Contact, ...). See docs/planning/05-admin-panel.md §2 —
 * one PATCH .../reorder endpoint per collection, applied in a single transaction,
 * instead of N individual PATCH calls per drag-and-drop reorder.
 */
export class ReorderItemBody {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsInt()
  position!: number;
}

export class ReorderBody {
  @ApiProperty({ type: [ReorderItemBody] })
  @ValidateNested({ each: true })
  @Type(() => ReorderItemBody)
  items!: ReorderItemBody[];
}
