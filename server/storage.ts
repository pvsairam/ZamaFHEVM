// Referenced from javascript_database blueprint
import {
  origins,
  encryptedEvents,
  aggregates,
  roles,
  fheKeys,
  type Origin,
  type InsertOrigin,
  type InsertOriginWithToken,
  type EncryptedEvent,
  type InsertEncryptedEvent,
  type Aggregate,
  type InsertAggregate,
  type Role,
  type InsertRole,
  type FheKey,
  type InsertFheKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Origins
  createOrigin(origin: InsertOriginWithToken): Promise<Origin>;
  getOriginById(id: string): Promise<Origin | undefined>;
  getOriginByToken(token: string): Promise<Origin | undefined>;
  getOriginsByOwner(ownerAddress: string): Promise<Origin[]>;
  deleteOrigin(id: string): Promise<void>;

  // Encrypted Events
  createEncryptedEvent(event: InsertEncryptedEvent): Promise<EncryptedEvent>;
  getEventsByOrigin(originId: string, limit?: number): Promise<EncryptedEvent[]>;
  getEventsByDateRange(originId: string, startDate: Date, endDate: Date): Promise<EncryptedEvent[]>;

  // Aggregates
  createAggregate(aggregate: InsertAggregate): Promise<Aggregate>;
  getAggregatesByOrigin(originId: string): Promise<Aggregate[]>;
  getAggregatesByDay(originId: string, day: Date): Promise<Aggregate[]>;

  // Roles
  createRole(role: InsertRole): Promise<Role>;
  getRolesByOrigin(originId: string): Promise<Role[]>;
  checkUserRole(originId: string, address?: string, email?: string): Promise<Role | undefined>;

  // FHE Keys
  createFheKey(key: InsertFheKey): Promise<FheKey>;
  getActiveKey(originId: string): Promise<FheKey | undefined>;
  getKeysByOrigin(originId: string): Promise<FheKey[]>;
}

export class DatabaseStorage implements IStorage {
  // Origins
  async createOrigin(insertOrigin: InsertOriginWithToken): Promise<Origin> {
    const [origin] = await db.insert(origins).values(insertOrigin).returning();
    return origin;
  }

  async getOriginById(id: string): Promise<Origin | undefined> {
    const [origin] = await db.select().from(origins).where(eq(origins.id, id));
    return origin || undefined;
  }

  async getOriginByToken(token: string): Promise<Origin | undefined> {
    const [origin] = await db.select().from(origins).where(eq(origins.token, token));
    return origin || undefined;
  }

  async getOriginsByOwner(ownerAddress: string): Promise<Origin[]> {
    return await db
      .select()
      .from(origins)
      .where(eq(origins.ownerAddress, ownerAddress));
  }

  async deleteOrigin(id: string): Promise<void> {
    await db.delete(origins).where(eq(origins.id, id));
  }

  // Encrypted Events
  async createEncryptedEvent(insertEvent: InsertEncryptedEvent): Promise<EncryptedEvent> {
    const [event] = await db.insert(encryptedEvents).values(insertEvent).returning();
    return event;
  }

  async getEventsByOrigin(originId: string, limit: number = 100): Promise<EncryptedEvent[]> {
    return await db
      .select()
      .from(encryptedEvents)
      .where(eq(encryptedEvents.originId, originId))
      .orderBy(desc(encryptedEvents.timestamp))
      .limit(limit);
  }

  async getEventsByDateRange(originId: string, startDate: Date, endDate: Date): Promise<EncryptedEvent[]> {
    return await db
      .select()
      .from(encryptedEvents)
      .where(
        and(
          eq(encryptedEvents.originId, originId),
          gte(encryptedEvents.timestamp, startDate),
          lte(encryptedEvents.timestamp, endDate)
        )
      )
      .orderBy(desc(encryptedEvents.timestamp));
  }

  // Aggregates
  async createAggregate(insertAggregate: InsertAggregate): Promise<Aggregate> {
    const [aggregate] = await db.insert(aggregates).values(insertAggregate).returning();
    return aggregate;
  }

  async getAggregatesByOrigin(originId: string): Promise<Aggregate[]> {
    return await db
      .select()
      .from(aggregates)
      .where(eq(aggregates.originId, originId))
      .orderBy(desc(aggregates.day));
  }

  async getAggregatesByDay(originId: string, day: Date): Promise<Aggregate[]> {
    return await db
      .select()
      .from(aggregates)
      .where(
        and(
          eq(aggregates.originId, originId),
          eq(aggregates.day, day)
        )
      );
  }

  // Roles
  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async getRolesByOrigin(originId: string): Promise<Role[]> {
    return await db
      .select()
      .from(roles)
      .where(eq(roles.originId, originId));
  }

  async checkUserRole(originId: string, address?: string, email?: string): Promise<Role | undefined> {
    if (!address && !email) return undefined;

    const conditions = [eq(roles.originId, originId)];
    if (address) conditions.push(eq(roles.address, address));
    if (email) conditions.push(eq(roles.email, email));

    const [role] = await db
      .select()
      .from(roles)
      .where(and(...conditions));

    return role || undefined;
  }

  // FHE Keys
  async createFheKey(insertKey: InsertFheKey): Promise<FheKey> {
    const [key] = await db.insert(fheKeys).values(insertKey).returning();
    return key;
  }

  async getActiveKey(originId: string): Promise<FheKey | undefined> {
    const [key] = await db
      .select()
      .from(fheKeys)
      .where(
        and(
          eq(fheKeys.originId, originId),
          eq(fheKeys.isActive, 'true')
        )
      )
      .orderBy(desc(fheKeys.createdAt))
      .limit(1);

    return key || undefined;
  }

  async getKeysByOrigin(originId: string): Promise<FheKey[]> {
    return await db
      .select()
      .from(fheKeys)
      .where(eq(fheKeys.originId, originId))
      .orderBy(desc(fheKeys.createdAt));
  }
}

export const storage = new DatabaseStorage();
