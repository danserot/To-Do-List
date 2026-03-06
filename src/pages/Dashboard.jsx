import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setTasks(data || []);
  };

  const addTask = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !user) return;

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      text: trimmed,
      completed: false,
    });

    if (!error) {
      setInputValue("");
      loadTasks();
    }
  };

  const toggleTask = async (task) => {
    await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    loadTasks();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadTasks();
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="pageContent">
        <div className="pageHeader">
          <h1>My Tasks</h1>
          <p>Manage your daily plans</p>
        </div>

        <div className="taskInputRow">
          <input
            type="text"
            placeholder="Add new task..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button onClick={addTask}>Add</button>
        </div>

        <div className="taskGrid">
          {tasks.map((task) => (
            <div className="taskCard" key={task.id}>
              <label className="taskMain">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                />
                <span className={task.completed ? "doneText" : ""}>
                  {task.text}
                </span>
              </label>

              <button
                className="deleteSmallBtn"
                onClick={() => deleteTask(task.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
