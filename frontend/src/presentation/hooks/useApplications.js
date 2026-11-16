import { useState, useEffect, useCallback } from 'react';import { ManageApplicationsUseCase } from '../../application/useCases/ManageApplicationsUseCase';
import { InMemoryApplicationRepository } from '../../infrastructure/repositories/InMemoryApplicationRepository';
import { ToastNotificationAdapter } from '../../infrastructure/adapters/ToastNotificationAdapter';

export default function useApplications(toast) {
  const [apps, setApps] = useState([]);

  const [uc] = useState(() => {
    const repo    = new InMemoryApplicationRepository();
    const adapter = new ToastNotificationAdapter(toast);
    return new ManageApplicationsUseCase(repo, adapter);
  });

  const load = useCallback(async () => {
    const all = await uc.getAll();
    setApps(all);
  }, [uc]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (data) => {
    const app = await uc.add(data);
    setApps(prev => [...prev, app]);
    return app;
  }, [uc]);

  const remove = useCallback(async (id) => {
    await uc.remove(id);
    setApps(prev => prev.filter(a => a.id !== id));
  }, [uc]);

  return { apps, add, remove };
}
