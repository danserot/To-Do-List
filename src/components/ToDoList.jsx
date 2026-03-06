export default function TodoList({ tasks, toggleTask, deleteTask }) {
  if (tasks.length === 0) {
    return <p className="emptyText">No tasks yet.</p>;
  }

  return (
    <ul id="list">
      {tasks.map((task) => (
        <li key={task.id} className="taskItem">
          <label className="taskLeft">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span className={task.completed ? "completed" : ""}>
              {task.text}
            </span>
          </label>

          <button className="deleteTaskBtn" onClick={() => deleteTask(task.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
