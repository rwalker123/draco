import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { loadSession } from '../../storage/authStorage';
import { useScoreSyncStore } from '../../state/scoreSyncStore';

const TASK_NAME = 'draco-score-sync';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const session = await loadSession();
    if (!session?.token) {
      return BackgroundFetch.Result.NoData;
    }

    const syncStore = useScoreSyncStore.getState();
    await syncStore.hydrate();
    await syncStore.flush(session.token);
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.warn('Score sync background task failed', error);
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerScoreSyncTask(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.Status.Restricted || status === BackgroundFetch.Status.Denied) {
    return;
  }

  const existingTasks = await TaskManager.getRegisteredTasksAsync();
  const alreadyRegistered = existingTasks.some((task) => task.taskName === TASK_NAME);
  if (alreadyRegistered) {
    return;
  }

  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 15 * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterScoreSyncTask(): Promise<void> {
  const existingTasks = await TaskManager.getRegisteredTasksAsync();
  const alreadyRegistered = existingTasks.some((task) => task.taskName === TASK_NAME);
  if (!alreadyRegistered) {
    return;
  }

  await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
}
