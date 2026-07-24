import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import { contact as contactTable } from '@/common/drizzle/schema';
import { ReorderItemBody } from '@/common/Reorder';
import { ContactPlatform } from '@/enums/contact-platform.enum';
import { Contact } from '../../../domain/entities/contact.entity';
import { ContactRepository } from '../../../domain/repositories/contact.repository';
import { CreateContactBody, UpdateContactBody } from '../../../presentation/dtos/contact.dto';

type ContactRow = typeof contactTable.$inferSelect;

@Injectable()
export class ContactRepositoryDrizzle extends ContactRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async findAll(visibleOnly: boolean): Promise<Contact[]> {
    const rows = visibleOnly
      ? await this.db
          .select()
          .from(contactTable)
          .where(eq(contactTable.isVisible, true))
          .orderBy(asc(contactTable.position))
      : await this.db.select().from(contactTable).orderBy(asc(contactTable.position));
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Contact | null> {
    const [row] = await this.db.select().from(contactTable).where(eq(contactTable.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(body: CreateContactBody): Promise<Contact> {
    const [row] = await this.db
      .insert(contactTable)
      .values({
        platform: body.platform,
        value: body.value,
        position: body.position ?? 0,
        isVisible: body.isVisible ?? true,
      })
      .returning();
    return this.toDomain(row);
  }

  async update(id: string, body: UpdateContactBody): Promise<Contact> {
    const [row] = await this.db
      .update(contactTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(contactTable.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Contact ${id} not found.`);
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db.delete(contactTable).where(eq(contactTable.id, id)).returning({ id: contactTable.id });
    if (!rows.length) throw new NotFoundException(`Contact ${id} not found.`);
  }

  async reorder(items: ReorderItemBody[]): Promise<void> {
    if (!items.length) return;

    // Single statement instead of N sequential UPDATEs — one round trip regardless of how many
    // items are being reordered, still atomic since it's one statement (no transaction needed).
    const rows = sql.join(
      items.map((item) => sql`(${item.id}::uuid, ${item.position}::int)`),
      sql`, `,
    );
    await this.db.execute(sql`
      UPDATE ${contactTable} AS t
      SET position = v.position
      FROM (VALUES ${rows}) AS v(id, position)
      WHERE t.id = v.id
    `);
  }

  private toDomain(row: ContactRow): Contact {
    return new Contact({
      id: row.id,
      platform: row.platform as ContactPlatform,
      value: row.value,
      position: row.position,
      isVisible: row.isVisible,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
