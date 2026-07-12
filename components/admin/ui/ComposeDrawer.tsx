"use client";

import { useState } from "react";
import { SlideOver } from "./SlideOver";
import type { CommunicationConfig } from "@/lib/admin/types";

export function ComposeDrawer({
  open,
  onClose,
  config,
  onSend,
  title = "Send message",
}: {
  open: boolean;
  onClose: () => void;
  config: CommunicationConfig | null;
  onSend: (data: {
    channel: "sms" | "email" | "both";
    subject: string;
    message: string;
  }) => Promise<void>;
  title?: string;
}) {
  const [channel, setChannel] = useState<"sms" | "email" | "both">("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxMessage =
    channel === "sms"
      ? (config?.maxSmsLength ?? 160)
      : (config?.maxEmailMessageLength ?? 5000);

  const handleSend = async () => {
    setError("");
    setLoading(true);
    try {
      await onSend({ channel, subject, message });
      setSubject("");
      setMessage("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideOver open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) =>
              setChannel(e.target.value as "sms" | "email" | "both")
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
          </select>
        </div>

        {(channel === "email" || channel === "both") && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={config?.maxSubjectLength ?? 200}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={maxMessage}
            rows={6}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-400">
            {message.length} / {maxMessage}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSend}
          disabled={loading || !message.trim()}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
    </SlideOver>
  );
}
