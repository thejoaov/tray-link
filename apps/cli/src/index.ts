#!/usr/bin/env node

import { Command } from 'commander'
import addCommand from './commands/add'
import listCommand from './commands/list'
import removeCommand from './commands/remove'

const program = new Command()

program.name('tlink').description('CLI to manage your Tray Link projects').version('1.0.0')

program.addCommand(addCommand)
program.addCommand(listCommand)
program.addCommand(removeCommand)

program
  .parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
