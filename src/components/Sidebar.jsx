import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <h2 className="logoText">TaskFlow</h2>

      <nav className="sidebarNav">
        <Link to="/dashboard">Tasks</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/stats">Statistics</Link>
      </nav>

      <button className="logoutBtn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}
