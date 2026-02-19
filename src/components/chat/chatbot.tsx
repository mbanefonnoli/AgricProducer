"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Chatbot() {
    const [inputValue, setInputValue] = useState("");

    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onError: (err) => {
            console.error("AI Chat Error:", err);
        }
    });

    const loading = status === "submitted" || status === "streaming";

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const message = inputValue.trim();
        setInputValue("");

        await sendMessage({ text: message });
    };

    return (
        <div className="flex flex-col h-[600px] rounded-lg border bg-white shadow-xl overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold">AI Command Center</h3>
            </div>

            {error && (
                <div className="bg-red-50 p-3 border-b border-red-100 text-red-600 text-sm flex items-center justify-between">
                    <span>{error.message || "Something went wrong. Please try again."}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={cn(
                            "flex gap-3 max-w-[80%]",
                            m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                            m.role === "user" ? "bg-slate-200" : "bg-indigo-100"
                        )}>
                            {m.role === "user"
                                ? <User className="h-4 w-4 text-slate-600" />
                                : <Bot className="h-4 w-4 text-indigo-600" />}
                        </div>
                        <div className={cn(
                            "rounded-lg p-3 text-sm shadow-sm",
                            m.role === "user" ? "bg-slate-900 text-white" : "bg-white border text-slate-800"
                        )}>
                            {m.parts?.map((part: any, i: number) =>
                                part.type === "text" ? <span key={i}>{part.text}</span> : null
                            ) ?? m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 mr-auto">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                        </div>
                        <div className="bg-white border text-slate-800 rounded-lg p-3 text-sm shadow-sm">
                            Assistant is thinking...
                        </div>
                    </div>
                )}
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-8">
                        <Bot className="h-12 w-12 mb-4" />
                        <p className="text-sm">
                            I can help you log stock, create clients, and summarize your finances.
                            Try asking "What's my current wheat stock?"
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-50">
                <div className="relative">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask anything..."
                        className="w-full rounded-md border border-slate-300 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 bg-white"
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputValue.trim()}
                        className="absolute right-2 top-1.5 p-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
