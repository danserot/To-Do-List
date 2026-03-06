export default function TodoInput({ inputValue, setInputValue, addTask }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  return (
    <div className="inputBlock">
      <input
        type="text"
        id="userInput"
        placeholder="What should I do?..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="buttons">
        <button id="addBtn" onClick={addTask}>
          Add
        </button>
      </div>
    </div>
  );
}
