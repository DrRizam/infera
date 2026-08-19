import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";
import { cn } from "@/lib/utils";

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(setNotifications);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const openPanel = async () => {
    setOpen((o) => !o);
    if (!open) fetchNotifications(user.id).then(setNotifications);
  };

  const handleRead = async (n) => {
    if (n.read_at) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
    await markNotificationRead(n.id);
  };

  const handleReadAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    await markAllNotificationsRead(user.id);
  };

  return (
    <div className="relative">
      <button
        type="button"
        title="Notifications"
        aria-label="Notifications"
        onClick={openPanel}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border-2 border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <button type="button" onClick={handleReadAll} className="text-xs font-semibold text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleRead(n)}
                      className={cn(
                        "block w-full border-b border-border/60 px-4 py-3 text-left last:border-0",
                        !n.read_at && "bg-accent/60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{n.title}</span>
                        {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
