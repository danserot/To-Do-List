import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/offlineAuth";
import { taskRepository } from "../services/taskRepository";

export default function Stats() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) return;
    setTasks(await taskRepository.list(currentUser));
  };

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="statsGrid">
      <div className="statCard">
        <h3>Всего задач</h3>
        <p>{total}</p>
      </div>

      <div className="statCard">
        <h3>Выполнено</h3>
        <p>{completed}</p>
      </div>

      <div className="statCard">
        <h3>Активные</h3>
        <p>{active}</p>
      </div>

      <div className="statCard">
        <h3>Прогресс</h3>
        <p>{progress}%</p>
      </div>
    </div>
  );
}
