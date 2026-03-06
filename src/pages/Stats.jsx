import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

export default function Stats() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data } = await supabase.from("tasks").select("*");
    setTasks(data || []);
  };

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="layout">
      <Sidebar />

      <main className="pageContent">
        <div className="statsGrid">
          <div className="statCard">
            <h3>Total tasks</h3>
            <p>{total}</p>
          </div>

          <div className="statCard">
            <h3>Completed</h3>
            <p>{completed}</p>
          </div>

          <div className="statCard">
            <h3>Active</h3>
            <p>{active}</p>
          </div>

          <div className="statCard">
            <h3>Progress</h3>
            <p>{progress}%</p>
          </div>
        </div>
      </main>
    </div>
  );
}
