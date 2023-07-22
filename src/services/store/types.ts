/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BaseStore {
  getAll?(): any
  get?(key: string): any
  create?(data: any): void
  update?(key: string, data: any): void
  delete?(key: string): void
}
