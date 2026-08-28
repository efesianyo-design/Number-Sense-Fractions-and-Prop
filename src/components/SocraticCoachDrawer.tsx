import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile, SocraticMessage } from '../types';
import { Sparkles, Bot, Volume2, Send, Loader2, Wifi, WifiOff, Zap } from 'lucide-react';
import { MathView } from './MathView';
import { playSound } from '../utils/audio';

interface SocraticCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile | null;
  currentModeTitle: string;
  currentProblemContext: string;
  offlineFallbackHints?: string[];
}

export const SocraticCoachDrawer: React.FC<SocraticCoachDrawerProps> = ({
  isOpen,
  onClose,
  student,
  currentModeTitle,
  currentProblemContext,
  offlineFallbackHints = [],
}) => {
  const [messages, setMessages] = useState<SocraticMessage[]>([
    {
      id: 'init-1',
      sender: 'coach',
      text: `Hello ${student?.name || 'Student'}! I am your Socratic Math Coach by Sir Eugene Technologies. Ask me about equivalent fractions, finding common denominators, or proportional scaling. I will guide your thinking step-by-step!`,
      latex: `\\frac{a}{b} = \\frac{a \\times k}{b \\times k}`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getOfflineRuleHint = (query: string): { text: string; latex?: string } => {
    const q = query.toLowerCase();

    if (q.includes('unlike') || q.includes('different denominator') || q.includes('add fraction') || q.includes('+')) {
      return {
        text: "When adding unlike fractions, find the Least Common Multiple (LCM) of the denominators first. For instance, to add thirds and quarters, convert both into twelfths. What is 1/3 in 12ths?",
        latex: `\\frac{1}{3} = \\frac{4}{12}, \\quad \\frac{1}{4} = \\frac{3}{12}`
      };
    }
    if (q.includes('round') || q.includes('decimal') || q.includes('nearest')) {
      return {
        text: "Look at the digit immediately to the right of your target place value. If that digit is 5 or greater, round UP to the next whole number. If it is 4 or less, round DOWN. Which whole number is closer on the number line?",
        latex: `3.74 \\rightarrow 4.0 \\quad (\\text{since } 0.74 \\ge 0.5)`
      };
    }
    if (q.includes('discount') || q.includes('percent') || q.includes('cedi') || q.includes('gh') || q.includes('gh₵')) {
      return {
        text: "Remember: 'Percent' means 'per hundred'. A discount of 25% means you save GH₵ 25 on every GH₵ 100 of the original price. What fraction of 100 does your discount represent?",
        latex: `\\text{Discount} = \\text{Price} \\times \\frac{\\text{Percent}}{100}`
      };
    }
    if (q.includes('pizza') || q.includes('share') || q.includes('slice') || q.includes('chocolate')) {
      return {
        text: "Fair sharing means each person receives an equal fraction of the whole item. If 3 friends share 6 slices equally, what fraction does each person get?",
        latex: `\\frac{6 \\text{ slices}}{3 \\text{ people}} = 2 \\text{ slices each} = \\frac{2}{6} = \\frac{1}{3}`
      };
    }
    if (offlineFallbackHints.length > 0) {
      const hint = offlineFallbackHints[Math.floor(Math.random() * offlineFallbackHints.length)];
      return { text: hint };
    }

    return {
      text: "Think about the relationship between the numerator (the parts you have) and the denominator (the total equal parts in one whole). Can you partition your strips into smaller matching units?",
      latex: `\\frac{1}{2} = \\frac{2}{4} = \\frac{3}{6} = \\frac{4}{8} = 50\\%`
    };
  };

  const submitQuestion = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    const userText = questionText.trim();
    setInputText('');

    const userMsg: SocraticMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: userText,
      timestamp: new Date(),
    };

    const coachMsgId = `coach-${Date.now()}`;
    const initialCoachMsg: SocraticMessage = {
      id: coachMsgId,
      sender: 'coach',
      text: '',
      timestamp: new Date(),
      isAiGenerated: true,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialCoachMsg]);
    setIsLoading(true);
    playSound('click');

    let streamSuccess = false;
    let accumulatedText = '';

    // Step 1: Attempt Ultra-fast SSE Streaming with a 4s timeout
    if (navigator.onLine) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch('/api/gemini/hint/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemTitle: currentModeTitle,
            problemContext: currentProblemContext,
            studentInput: userText,
            studentLevel: student?.level || 'Form 1',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.text) {
                    accumulatedText += data.text;
                    streamSuccess = true;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === coachMsgId
                          ? { ...m, text: accumulatedText, isStreaming: true }
                          : m
                      )
                    );
                  }
                  if (data.done) {
                    break;
                  }
                } catch {
                  // ignore non-json SSE frames
                }
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('Stream failed or aborted, attempting fallback:', streamErr);
      }
    }

    // Step 2: If stream did not return text, try quick fallback or local rules
    if (!accumulatedText.trim()) {
      if (navigator.onLine) {
        try {
          const fastRes = await fetch('/api/gemini/hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemTitle: currentModeTitle,
              problemContext: currentProblemContext,
              studentInput: userText,
              studentLevel: student?.level || 'Form 1',
            }),
          });

          if (fastRes.ok) {
            const fastData = await fastRes.json();
            if (fastData.hint) {
              accumulatedText = fastData.hint;
            }
          }
        } catch {
          // fallback to offline heuristics below
        }
      }

      if (!accumulatedText.trim()) {
        const offline = getOfflineRuleHint(userText);
        accumulatedText = offline.text;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === coachMsgId
              ? { ...m, text: offline.text, latex: offline.latex, isStreaming: false }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === coachMsgId
              ? { ...m, text: accumulatedText, isStreaming: false }
              : m
          )
        );
      }
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === coachMsgId
            ? { ...m, text: accumulatedText, isStreaming: false }
            : m
        )
      );
    }

    setIsLoading(false);
    playSound('pop');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(inputText);
  };

  return (
    <div id="socratic-drawer-backdrop" className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div id="socratic-drawer-panel" className="w-full max-w-md bg-white border-l border-slate-200 flex flex-col h-[100dvh] text-slate-800 shadow-2xl">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-800">Socratic Math Coach</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Ultra-Fast AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Mode: <span className="text-blue-600 font-bold">{currentModeTitle}</span>
              </p>
            </div>
          </div>
          <button
            id="close-socratic-coach-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status ribbon */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            {navigator.onLine ? (
              <span className="flex items-center gap-1 text-green-700 font-bold">
                <Wifi className="w-3.5 h-3.5 text-green-600" /> Real-time Streaming Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-700 font-bold">
                <WifiOff className="w-3.5 h-3.5 text-orange-600" /> Offline Instant Coach
              </span>
            )}
          </div>
          <span className="text-slate-500 font-bold">{student?.level || 'Form 1 SHS'}</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.sender === 'student'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xs font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold opacity-80">
                    {m.sender === 'student' ? (student?.name || 'You') : 'Socratic Coach'}
                  </span>
                  {m.sender === 'coach' && m.text && (
                    <button
                      onClick={() => speakText(m.text)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {m.text ? (
                  <p className="whitespace-pre-wrap">
                    {m.text}
                    {m.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-600 animate-pulse align-middle" />
                    )}
                  </p>
                ) : m.isStreaming ? (
                  <div className="flex items-center space-x-2 text-blue-600 font-medium py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : null}

                {m.latex && (
                  <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50 px-2 py-1 rounded text-blue-700 font-bold">
                    <MathView latex={m.latex} />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            type="button"
            onClick={() => submitQuestion("How do I find a common denominator for these fractions?")}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            Finding common denominator?
          </button>
          <button
            type="button"
            onClick={() => submitQuestion("Why are two 1/4 strips equal to one 1/2 strip?")}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            Equivalence concept?
          </button>
          <button
            type="button"
            onClick={() => submitQuestion("How do I round a decimal on the number line?")}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            Rounding rule?
          </button>
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            id="socratic-coach-input"
            type="text"
            placeholder="Ask a question or explain where you're stuck..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none disabled:opacity-50"
          />
          <button
            id="socratic-coach-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold p-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

