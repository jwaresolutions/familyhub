import { Router } from 'express';

export interface AppModule {
  name: string;
  prefix: string;
  router: Router;
  icon: string;
  description: string;
}

const modules: AppModule[] = [];

export function registerModule(mod: AppModule) {
  modules.push(mod);
}

export function getModules() {
  return modules.map(({ name, prefix, icon, description }) => ({ name, prefix, icon, description }));
}

export function mountModules(parentRouter: Router) {
  for (const mod of modules) {
    parentRouter.use(mod.prefix, mod.router);
  }
}
