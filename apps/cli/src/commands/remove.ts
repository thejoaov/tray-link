import { Command } from 'commander';
import { projectStore } from '../storage';

export default new Command('remove')
  .description('Remove a project by name or ID')
  .argument('<name-or-id>', 'Project name or ID')
  .action(async (target) => {
    const projects = await projectStore.getProjects();
    const project = projects.find(p => p.id === target || p.name === target);
    
    if (!project) {
      console.error(`Project not found: ${target}`);
      process.exit(1);
    }

    await projectStore.removeProject(project.id);
    console.log(`Removed project: ${project.name}`);
  });
