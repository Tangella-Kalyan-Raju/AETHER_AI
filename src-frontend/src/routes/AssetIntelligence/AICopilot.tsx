import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  Send,
  Plus,
  Pin,
  Trash,
  Edit3,
  ShieldAlert,
  Sparkles,
  Copy,
  Download,
  Loader2,
} from "lucide-react";
import { copilotApi, Conversation, Message } from "../../api/copilot";

export default function AICopilot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionUuid] = useState(() => `sess-${Math.random().toString(36).substr(2, 9)}`);

  // States for renaming
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const list = await copilotApi.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const startSession = async () => {
    try {
      await copilotApi.startSession(sessionUuid, "Llama 3.3 70B (Groq)");
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    startSession();
  }, []);

  const loadMessages = async (convId: string) => {
    try {
      const list = await copilotApi.getMessages(convId);
      setMessages(list);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreate = async () => {
    try {
      const title = `New Conversation ${conversations.length + 1}`;
      const conv = await copilotApi.createConversation(title);
      setConversations([conv, ...conversations]);
      setActiveConv(conv);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) return;
    try {
      const updated = await copilotApi.renameConversation(id, newName);
      setConversations(conversations.map((c) => (c.id === id ? updated : c)));
      if (activeConv?.id === id) {
        setActiveConv(updated);
      }
      setEditingId(null);
      setNewName("");
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  const handlePin = async (c: Conversation) => {
    try {
      const updated = await copilotApi.pinConversation(c.id, !c.is_pinned);
      setConversations(
        conversations
          .map((x) => (x.id === c.id ? updated : x))
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
      if (activeConv?.id === c.id) {
        setActiveConv(updated);
      }
    } catch (err) {
      console.error("Failed to pin conversation:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await copilotApi.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConv?.id === id) {
        setActiveConv(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSend = async () => {
    if (!query.trim() || !activeConv) return;
    try {
      setLoading(true);
      const userText = query;
      setQuery("");

      // Temporary optimistic add
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: activeConv.id,
        role: "user",
        content: userText,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const res = await copilotApi.submitChat(
        activeConv.id,
        userText,
        "Enterprise System Prompt",
        sessionUuid
      );
      loadMessages(activeConv.id);
    } catch (err) {
      console.error("Failed to submit chat message:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    try {
      const structured = JSON.parse(content);
      return (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] font-mono text-xs select-text text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A313C] pb-2">
            <span className="font-bold text-emerald-500 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Copilot Recommendation Report
            </span>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                Confidence: {structured.Confidence || 95}%
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(structured, null, 2))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#252D37] rounded transition"
                title="Copy JSON Response"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                Situation
              </span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{structured.Situation}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                Analysis
              </span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{structured.Analysis}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                Reasoning
              </span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{structured.Reasoning}</p>
            </div>
            <div className="p-3 border border-emerald-500/15 bg-emerald-500/5 rounded-[2px]">
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
                Recommendation
              </span>
              <p className="text-slate-800 dark:text-slate-250 mt-0.5 font-bold">
                {structured.Recommendation}
              </p>
            </div>
            <div className="p-3 border border-rose-500/15 bg-rose-500/5 rounded-[2px]">
              <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Risks Identified
              </span>
              <p className="text-slate-850 dark:text-slate-300 mt-0.5">
                {structured.Risks || "None recorded."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#2A313C] text-[10px] text-slate-400">
              <div>
                <span className="uppercase block font-bold">Expected Impact</span>
                <span className="text-emerald-500 font-bold">
                  {structured["Expected Impact"] || "Nominal"}
                </span>
              </div>
              <div>
                <span className="uppercase block font-bold">References</span>
                <span>{structured.References || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      // Return raw text if not JSON
      return <p className="whitespace-pre-wrap select-text text-left font-sans">{content}</p>;
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] border border-slate-200 dark:border-[#2A313C] rounded-[4px] overflow-hidden bg-white dark:bg-[#181F2A]">
      {/* Sidebar - Conversations list */}
      <div className="w-64 border-r border-slate-200 dark:border-[#2A313C] flex flex-col justify-between shrink-0 bg-slate-50 dark:bg-[#131922]">
        <div className="p-4 flex flex-col space-y-4 h-full overflow-hidden">
          <button
            onClick={handleCreate}
            className="w-full py-2 border border-dashed border-slate-300 dark:border-[#2A313C] hover:border-emerald-500 text-slate-700 dark:text-slate-350 hover:text-emerald-500 rounded-[4px] font-mono text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between p-2.5 rounded-[4px] border transition cursor-pointer font-mono text-[11px] ${
                  activeConv?.id === c.id
                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-450"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#1c2431]/40"
                }`}
                onClick={() => setActiveConv(c)}
              >
                {editingId === c.id ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(c.id)}
                    onBlur={() => setEditingId(null)}
                    className="bg-transparent border-b border-emerald-500 text-[11px] focus:outline-none w-full"
                    autoFocus
                  />
                ) : (
                  <span className="truncate pr-2 font-bold">{c.title}</span>
                )}

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePin(c);
                    }}
                    className={`p-0.5 rounded hover:bg-slate-200 dark:hover:bg-[#252D37] ${c.is_pinned ? "text-emerald-500" : "text-slate-400"}`}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(c.id);
                      setNewName(c.title);
                    }}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-[#252D37] text-slate-400"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-[#252D37] text-rose-500"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#181F2A]">
        {/* Active conversation info */}
        {activeConv && (
          <div className="p-3.5 border-b border-slate-200 dark:border-[#2A313C] flex items-center justify-between font-mono text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Active Node: {activeConv.title}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Model: Llama 3.3 70B</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] border border-emerald-500/20 uppercase tracking-widest font-bold">
                Active Session
              </span>
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl rounded-[4px] p-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-500 text-white font-sans text-right"
                    : "bg-slate-100 dark:bg-[#1E2530] text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-[#2A313C]/50 w-full"
                }`}
              >
                {m.role === "user" ? m.content : renderMessageContent(m.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 dark:bg-[#1c2431]/20 border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-[10px] font-mono text-slate-450 uppercase">
                  Formulating structured answer...
                </span>
              </div>
            </div>
          )}

          {!activeConv && (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-center">
              <BrainCircuit className="w-10 h-10 text-slate-300 dark:text-slate-600 animate-pulse" />
              <p className="font-mono text-xs text-slate-500">
                Select or initialize a conversation thread.
              </p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        {activeConv && (
          <div className="p-4 border-t border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#131922] flex gap-2">
            <input
              type="text"
              placeholder="Ask GPO Copilot about outages, dispatch schedules, or logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#181F2A] border border-slate-255 dark:border-[#2A313C] rounded-[4px] font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-[4px] transition flex items-center justify-center gap-2 font-mono text-xs"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
