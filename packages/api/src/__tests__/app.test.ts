import { describe, it, expect } from 'vitest';
import app from '../app';

describe('Express app', () => {
  it('is defined and has expected routes', () => {
    expect(app).toBeDefined();

    const routes = app._router.stack
      .filter((layer: { route?: { path: string } }) => layer.route)
      .map((layer: { route: { path: string } }) => layer.route.path);

    expect(routes).toContain('/api/health');
    expect(routes).toContain('/api/version');
  });
});
