"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";

const TOOL_LABEL: Record<string, string> = {
  "tool-list_tasks": "Reading tasks",
  "tool-create_task": "Creating task",
  "tool-update_task": "Updating task",
  "tool-set_task_done": "Updating task",
  "tool-delete_task": "Deleting task",
};

export default function ChatPanel({
  open,
  onOpenChange,
  onTasksChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksChanged: () => void;
}) {
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: () => onTasksChanged(),
  });

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as unknown as WindowWithSpeech).SpeechRecognition ||
          (window as unknown as WindowWithSpeech).webkitSpeechRecognition
        : undefined;
    if (!SR) return;
    setVoiceSupported(true);
    const recognition: SpeechRecognitionLike = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (e: SpeechRecognitionResultEventLike) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) {
        sendMessage({ text: transcript });
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  function toggleMic() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  const busy = status === "submitted" || status === "streaming";

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        aria-label="Open assistant"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xl transition hover:bg-[var(--accent-hover)]"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[min(560px,80vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl trkr-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-white">
            t
          </span>
          <span className="text-sm font-medium">Assistant</span>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close assistant"
          className="rounded-md p-1 text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <CloseIcon />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-6 text-center text-sm text-[var(--text-faint)]">
            <p className="mb-3 text-[var(--text-muted)]">Try asking:</p>
            <div className="space-y-1.5">
              <Example
                text="Add a high-priority Admin task to renew the Alteryx license, due Friday"
                onPick={(t) => sendMessage({ text: t })}
              />
              <Example
                text="What's overdue?"
                onPick={(t) => sendMessage({ text: t })}
              />
              <Example
                text="Mark the ABB sensor data task done"
                onPick={(t) => sendMessage({ text: t })}
              />
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--text)]"
              }`}
            >
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  return <span key={i} className="whitespace-pre-wrap">{part.text}</span>;
                }
                if (isToolUIPart(part)) {
                  const label = TOOL_LABEL[part.type] ?? "Working";
                  if (part.state === "output-available") return null;
                  return (
                    <span
                      key={i}
                      className="block text-xs italic text-[var(--text-faint)]"
                    >
                      {label}…
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[var(--surface-2)] px-3.5 py-2.5">
              <span className="trkr-pulse text-sm text-[var(--text-muted)]">…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3.5 py-2.5 text-sm">
              <p className="text-[var(--danger)]">
                Something went wrong reaching the assistant.
              </p>
              <button
                onClick={() => regenerate()}
                className="mt-1.5 text-xs font-medium text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-[var(--border)] p-3"
      >
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Speak"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
              listening
                ? "border-[var(--danger)] bg-[var(--danger)]/15 text-[var(--danger)] trkr-pulse"
                : "border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            }`}
          >
            <MicIcon />
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Ask or tell me a task…"}
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function Example({
  text,
  onPick,
}: {
  text: string;
  onPick: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(text)}
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-xs text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
    >
      “{text}”
    </button>
  );
}

/* --- icons --- */
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l16-8-6 16-3-7-7-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/* --- minimal Web Speech API typings --- */
type SpeechRecognitionResultEventLike = {
  results: { 0: { transcript: string } }[];
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (e: SpeechRecognitionResultEventLike) => void;
  onend: () => void;
  onerror: () => void;
};
type WindowWithSpeech = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};
