"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "@/lib/api";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/v1/notifications");
      const data = res.data?.items ?? res.data ?? [];
      setNotifications(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch {
      // Silent fail — bell shows 0 if API unavailable
    }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Silent fail
    }
  };

  const preview = notifications.slice(0, 3);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-[var(--alling-metadata)] hover:text-[var(--alling-primary)] transition-colors rounded-md hover:bg-gray-50"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--alling-danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-[var(--alling-border)] rounded-md shadow-lg z-50"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          <div className="px-4 py-3 border-b border-[var(--alling-border)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--alling-text)]">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-xs text-[var(--alling-metadata)]">{unreadCount} sin leer</span>
            )}
          </div>

          <ul className="divide-y divide-[var(--alling-border)] max-h-72 overflow-y-auto" role="list">
            {preview.length === 0 ? (
              <li className="px-4 py-6 text-sm text-[var(--alling-metadata)] text-center">
                Sin notificaciones
              </li>
            ) : (
              preview.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => markRead(n.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                      n.read ? "text-[var(--alling-metadata)]" : "text-[var(--alling-text)] font-medium"
                    }`}
                  >
                    <p className="line-clamp-2">{n.message}</p>
                    <time className="text-xs text-[var(--alling-metadata)] mt-1 block">
                      {new Date(n.created_at).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </button>
                </li>
              ))
            )}
          </ul>

          {notifications.length > 3 && (
            <div className="px-4 py-2 border-t border-[var(--alling-border)]">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-[var(--alling-primary)] hover:underline"
              >
                Ver todas →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
