export default function Header() {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="header">
      <h1 className="headerText">- To-do list -</h1>
      <div className="calendar">{today}</div>
    </header>
  );
}
