import React, { useState } from 'react';
import { FractionDenominator, FormLevel } from '../../types';
import { DENOMINATORS } from '../../utils/math';
import { playSound } from '../../utils/audio';
import { 
  Sparkles, 
  Hand, 
  Send, 
  BookOpen, 
  Plus, 
  Minus, 
  X, 
  Divide, 
  Lightbulb, 
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { WorkspaceMode } from '../Header';

export type FractionEngineTab = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'scanner' | 'comparator';

interface CustomFractionQuestionBarProps {
  onLoadCustomProblem: (params: {
    tab: WorkspaceMode;
    f1: { num: number; den: FractionDenominator };
    f2: { num: number; den: FractionDenominator };
    operation: '+' | '-' | '*' | '/';
    isStudentChallenge?: boolean;
    customPrompt?: string;
  }) => void;
  currentMode?: WorkspaceMode;
}

interface CurriculumPresetItem {
  label: string;
  op: '+' | '-' | '*' | '/';
  f1: { num: number; den: FractionDenominator };
  f2: { num: number; den: FractionDenominator };
  tab: WorkspaceMode;
  prompt?: string;
}

const CURRICULUM_PRESETS: Record<FormLevel, CurriculumPresetItem[]> = {
  'Form 1': [
    { label: '1/2 + 1/4', op: '+', f1: { num: 1, den: 2 }, f2: { num: 1, den: 4 }, tab: 'addition' },
    { label: '3/4 - 1/2', op: '-', f1: { num: 3, den: 4 }, f2: { num: 1, den: 2 }, tab: 'subtraction' },
    { label: '1/2 × 1/2', op: '*', f1: { num: 1, den: 2 }, f2: { num: 1, den: 2 }, tab: 'multiplication' },
    { label: '1 ÷ 1/3', op: '/', f1: { num: 1, den: 1 }, f2: { num: 1, den: 3 }, tab: 'division' },
    { 
      label: 'Accra Bread (1/3 + 1/6)', 
      op: '-', 
      f1: { num: 1, den: 3 }, 
      f2: { num: 1, den: 6 }, 
      tab: 'subtraction',
      prompt: 'Mary ate 1/3 and John ate 1/6 of Accra sugar bread. Find the remaining fraction.' 
    },
  ],
  'Form 2': [
    { label: '2/3 + 1/6', op: '+', f1: { num: 2, den: 3 }, f2: { num: 1, den: 6 }, tab: 'addition' },
    { label: '5/6 - 1/3', op: '-', f1: { num: 5, den: 6 }, f2: { num: 1, den: 3 }, tab: 'subtraction' },
    { label: '2/3 × 3/4', op: '*', f1: { num: 2, den: 3 }, f2: { num: 3, den: 4 }, tab: 'multiplication' },
    { label: '1/2 ÷ 1/6', op: '/', f1: { num: 1, den: 2 }, f2: { num: 1, den: 6 }, tab: 'division' },
    { 
      label: 'Sobolo Jug (1/4 + 3/8)', 
      op: '-', 
      f1: { num: 1, den: 4 }, 
      f2: { num: 3, den: 8 }, 
      tab: 'subtraction',
      prompt: 'Akua poured 1/4L ginger juice and 3/8L hibiscus extract into a 1L jug.' 
    },
  ],
  'Form 3': [
    { label: '3/8 + 1/4', op: '+', f1: { num: 3, den: 8 }, f2: { num: 1, den: 4 }, tab: 'addition' },
    { label: '2/3 - 1/4', op: '-', f1: { num: 2, den: 3 }, f2: { num: 1, den: 4 }, tab: 'subtraction' },
    { label: '4/5 × 2/3', op: '*', f1: { num: 4, den: 5 }, f2: { num: 2, den: 3 }, tab: 'multiplication' },
    { label: '1/4 ÷ 1/3', op: '/', f1: { num: 1, den: 4 }, f2: { num: 1, den: 3 }, tab: 'division' },
    { 
      label: 'Kente Fabric (2/5 + 3/10)', 
      op: '-', 
      f1: { num: 2, den: 5 }, 
      f2: { num: 3, den: 10 }, 
      tab: 'subtraction',
      prompt: 'Students cut 2/5 for banners and 3/10 for costumes from a 1m Kente strip.' 
    },
  ],
};

export const CustomFractionQuestionBar: React.FC<CustomFractionQuestionBarProps> = ({
  onLoadCustomProblem,
}) => {
  const [inputText, setInputText] = useState('3/8 + 1/4');
  const [selectedOp, setSelectedOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [activeFormTab, setActiveFormTab] = useState<FormLevel>('Form 1');
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(false);

  // Parse input string like "3/8 + 1/4" or "2/3 * 3/4"
  const parseExpression = (text: string) => {
    let op: '+' | '-' | '*' | '/' = selectedOp;
    if (text.includes('+')) op = '+';
    else if (text.includes('-') || text.includes('−')) op = '-';
    else if (text.includes('*') || text.includes('×') || text.includes('x')) op = '*';
    else if (text.includes('÷') || (text.includes('/') && text.split('/').length > 2)) op = '/';

    const clean = text.replace(/[\(\)]/g, '');
    let parts: string[] = [];

    if (op === '+') parts = clean.split('+');
    else if (op === '-') parts = clean.split(/[-−]/);
    else if (op === '*') parts = clean.split(/[*×x]/);
    else if (op === '/') {
      if (clean.includes('÷')) {
        parts = clean.split('÷');
      } else {
        const tokens = clean.trim().split(/\s+/);
        if (tokens.length === 3 && tokens[1] === '/') {
          parts = [tokens[0], tokens[2]];
        } else {
          parts = clean.split('/');
        }
      }
    }

    const parseFrac = (str: string): { num: number; den: FractionDenominator } => {
      const s = str.trim();
      if (s.includes('/')) {
        const [n, d] = s.split('/').map((x) => parseInt(x, 10));
        const den = ([1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as FractionDenominator[]).includes(
          d as FractionDenominator
        )
          ? (d as FractionDenominator)
          : 4;
        return { num: isNaN(n) ? 1 : Math.max(1, n), den };
      }
      const val = parseInt(s, 10);
      if (!isNaN(val) && val === 1) return { num: 1, den: 1 };
      return { num: isNaN(val) ? 1 : val, den: 2 };
    };

    const f1 = parts[0] ? parseFrac(parts[0]) : { num: 1, den: 2 };
    const f2 = parts[1] ? parseFrac(parts[1]) : { num: 1, den: 4 };

    let targetTab: WorkspaceMode = 'addition';
    if (op === '+') targetTab = 'addition';
    if (op === '-') targetTab = 'subtraction';
    if (op === '*') targetTab = 'multiplication';
    if (op === '/') targetTab = 'division';

    return { op, f1, f2, targetTab };
  };

  const handleAutoLoad = () => {
    const parsed = parseExpression(inputText);
    playSound('snap');
    onLoadCustomProblem({
      tab: parsed.targetTab,
      f1: parsed.f1,
      f2: parsed.f2,
      operation: parsed.op,
      isStudentChallenge: false,
    });
  };

  const handlePlaceTilesMyself = () => {
    const parsed = parseExpression(inputText);
    playSound('jump');
    onLoadCustomProblem({
      tab: parsed.targetTab,
      f1: parsed.f1,
      f2: parsed.f2,
      operation: parsed.op,
      isStudentChallenge: true,
      customPrompt: `Challenge: Place the correct fraction strips for ${parsed.f1.num}/${parsed.f1.den} ${parsed.op} ${parsed.f2.num}/${parsed.f2.den} and solve!`,
    });
  };

  const handleSelectPreset = (p: CurriculumPresetItem) => {
    setInputText(`${p.f1.num}/${p.f1.den} ${p.op} ${p.f2.num}/${p.f2.den}`);
    setSelectedOp(p.op);
    playSound('click');
    onLoadCustomProblem({
      tab: p.tab,
      f1: p.f1,
      f2: p.f2,
      operation: p.op,
      isStudentChallenge: false,
      customPrompt: p.prompt,
    });
  };

  return (
    <div id="custom-fraction-question-bar" className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
      
      {/* Input & Action Bar */}
      <div className="flex flex-col md:flex-row items-center gap-2.5">
        
        {/* Left Indicator */}
        <div className="flex items-center space-x-2 text-xs font-black text-slate-800 whitespace-nowrap self-start md:self-center">
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">Custom Problem:</span>
        </div>

        {/* Text Input with Quick Op Buttons */}
        <div className="flex-1 w-full flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 3/8 + 1/4, 5/6 - 1/3, 2/3 * 3/4, 1/2 / 1/6"
            className="flex-1 bg-transparent text-xs sm:text-sm font-mono font-bold text-slate-800 outline-none px-2"
          />

          {/* Quick Op Selector */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
            {[
              { op: '+', label: '+', title: 'Add' },
              { op: '-', label: '−', title: 'Subtract' },
              { op: '*', label: '×', title: 'Multiply' },
              { op: '/', label: '÷', title: 'Divide' },
            ].map((o) => (
              <button
                key={o.op}
                onClick={() => {
                  setSelectedOp(o.op as any);
                  // update text if currently has op
                  const parsed = parseExpression(inputText);
                  setInputText(`${parsed.f1.num}/${parsed.f1.den} ${o.op} ${parsed.f2.num}/${parsed.f2.den}`);
                  playSound('click');
                }}
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                  selectedOp === o.op
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
                title={o.title}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Auto-Load vs Place Myself */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={handleAutoLoad}
            className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            title="Automatically load and solve in workspace"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>✨ Auto-Load</span>
          </button>

          <button
            onClick={handlePlaceTilesMyself}
            className="flex-1 md:flex-initial bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            title="Create challenge and place tiles manually"
          >
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>✋ Place Myself</span>
          </button>

          {/* Expand Presets Drawer Button */}
          <button
            onClick={() => {
              setIsPresetsExpanded((prev) => !prev);
              playSound('pop');
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isPresetsExpanded
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Curriculum presets by Form Level"
          >
            <GraduationCap className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Expandable Curriculum Presets by Form 1, Form 2, Form 3 */}
      {isPresetsExpanded && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <div className="flex items-center gap-1 text-xs font-black text-slate-800 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>GES / WAEC Curriculum Presets:</span>
            </div>

            {/* Form Level Tabs */}
            <div className="flex items-center gap-1">
              {(['Form 1', 'Form 2', 'Form 3'] as FormLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setActiveFormTab(lvl);
                    playSound('click');
                  }}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                    activeFormTab === lvl
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CURRICULUM_PRESETS[activeFormTab].map((p, idx) => (
              <button
                key={`${activeFormTab}-${idx}`}
                onClick={() => handleSelectPreset(p)}
                className="bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 group"
              >
                <span className="font-mono text-blue-600 group-hover:underline">{p.label}</span>
                {p.prompt && (
                  <span className="text-[10px] text-slate-400 max-w-[120px] truncate">
                    ({p.prompt})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
