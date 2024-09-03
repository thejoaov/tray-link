/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BaseStore {
  getAll?(): unknown
  get?(key: string): unknown
  create?(data: unknown): void
  update?(key: string, data: unknown): void
  delete?(key: string): void
}
