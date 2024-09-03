import { ProjectSchema } from '../services/store/schema.js'
import { v4 as uuidv4 } from 'uuid'

export default class Project implements ProjectSchema {
  id: string
  name: string
  path: string
  createdAt: Date
  updatedAt: Date
  position: number
  isFavorite: boolean

  constructor({
    name,
    path,
    isFavorite = false,
    position = 0,
  }: {
    name: string
    path: string
    isFavorite?: boolean
    position?: number
  }) {
    this.id = uuidv4()
    this.name = name
    this.path = path
    this.position = position
    this.isFavorite = isFavorite
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }
}
