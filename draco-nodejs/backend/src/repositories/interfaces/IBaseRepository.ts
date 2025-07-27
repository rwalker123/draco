/**
 * Base repository interface defining common database operations
 */
export interface IBaseRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  findById(id: string | number): Promise<T | null>;
  findMany(where?: Record<string, unknown>): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: string | number, data: TUpdate): Promise<T>;
  delete(id: string | number): Promise<T>;
  count(where?: Record<string, unknown>): Promise<number>;
}
