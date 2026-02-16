"use client";

import dynamic from "next/dynamic";

const Chatbot = dynamic(() => import("@/components/chat/chatbot").then(mod => mod.Chatbot), {
    ssr: false,
    loading: () => <div className="h-[600px] rounded-lg border bg-slate-50 animate-pulse flex items-center justify-center text-slate-400">Loading AI Assistant...</div>
});

export default function AIPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
                <p className="text-slate-500">Interact with your dashboard using natural language.</p>
            </div>

            <Chatbot />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-slate-50">
                    <h4 className="font-semibold text-sm mb-2">Example Commands</h4>
                    <ul className="text-xs text-slate-600 space-y-2">
                        <li>• "What is my current stock of wheat?"</li>
                        <li>• "I just harvested 500kg of corn."</li>
                        <li>• "Summarize my finances for this month."</li>
                        <li>• "Create a new client named 'Farm Fresh Ltd'."</li>
                    </ul>
                </div>
                <div className="p-4 rounded-lg border bg-slate-50">
                    <h4 className="font-semibold text-sm mb-2">How it works</h4>
                    <p className="text-xs text-slate-600">
                        Our AI uses Function Calling to securely access your data in Supabase.
                        Every action taken by the AI is logged in your system history.
                    </p>
                </div>
            </div>
        </div>
    );
}
