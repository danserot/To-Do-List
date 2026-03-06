import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;
    setUser(currentUser);

    if (!currentUser) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
      });
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      })
      .eq("id", user.id);
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="pageContent">
        <div className="profileCard">
          <div className="profileTop">
            <img
              src={profile.avatar_url || "https://placehold.co/140x140"}
              alt="avatar"
              className="profileAvatar"
            />
            <div>
              <h1>{profile.full_name || "User"}</h1>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="profileFields">
            <input
              type="text"
              placeholder="Full name"
              value={profile.full_name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, full_name: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Avatar URL"
              value={profile.avatar_url}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, avatar_url: e.target.value }))
              }
            />

            <button onClick={saveProfile}>Save profile</button>
          </div>
        </div>
      </main>
    </div>
  );
}
