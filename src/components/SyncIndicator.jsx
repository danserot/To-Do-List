import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, CloudOff, LoaderCircle } from "lucide-react";
import { isCloudSyncEnabled } from "../services/cloudRepository";
import { syncStatus } from "../services/syncStatus";

export default function SyncIndicator({ user }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [status, setStatus] = useState(syncStatus.get());
  const cloudEnabled = isCloudSyncEnabled(user);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const unsubscribe = syncStatus.subscribe(setStatus);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsubscribe();
    };
  }, []);

  let label = "Локально";
  let Icon = Cloud;
  if (!online) { label = "Офлайн"; Icon = CloudOff; }
  else if (cloudEnabled && status === "syncing") { label = "Синхронизация"; Icon = LoaderCircle; }
  else if (cloudEnabled && status === "error") { label = "Ошибка синхронизации"; Icon = CloudOff; }
  else if (cloudEnabled) { label = "Сохранено"; Icon = CheckCircle2; }

  return <div className={`syncIndicator status-${status}`} role="status" title={label}><Icon size={15} /><span>{label}</span></div>;
}
