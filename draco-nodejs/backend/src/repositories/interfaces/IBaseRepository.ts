/**
 * Base repository interface defining common database operations
 */
export interface IBaseRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  findById(id: bigint): Promise<T | null>;
  findMany(where?: Record<string, unknown>): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: bigint, data: TUpdate): Promise<T>;
  delete(id: bigint): Promise<T>;
  count(where?: Record<string, unknown>): Promise<number>;
}
