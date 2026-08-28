import React, { useState, useMemo } from 'react';
import { ActivityLog, StudentProfile, FormLevel } from '../types';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  Download, 
  Sparkles,
  BookOpen,
  Filter
} from 'lucide-react';
import { MathView } from './MathView';
import { playSound } from '../utils/audio';

interface PerformanceChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  student: StudentProfile | null;
}

export const PerformanceChartModal: React.FC<PerformanceChartModalProps> = ({
  isOpen,
  onClose,
  logs,
  student,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'recent'>('all');

  if (!isOpen) return null;

  // Filter logs by student if logged in, or show current session
  const studentLogs = useMemo(() => {
    let list = logs;
    if (student?.name) {
      const match = list.filter((l) => l.studentName.toLowerCase() === student.name.toLowerCase());
      if (match.length > 0) list = match;
    }
    if (selectedTopic !== 'all') {
      list = list.filter((l) => l.topic === selectedTopic);
    }
    return list;
  }, [logs, student, selectedTopic]);

  // Overall KPIs
  const totalAttempts = studentLogs.length;
  const successfulAttempts = studentLogs.filter((l) => l.success).length;
  const overallAccuracy = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;
  const totalScore = studentLogs.reduce((acc, curr) => acc + (curr.score || 0), 0);

  // Topic Mastery Breakdown
  const topicMasteryData = useMemo(() => {
    const topicMap: Record<string, { total: number; success: number; score: number }> = {};
    
    logs.forEach((log) => {
      if (!topicMap[log.topic]) {
        topicMap[log.topic] = { total: 0, success: 0, score: 0 };
      }
      topicMap[log.topic].total += 1;
      if (log.success) topicMap[log.topic].success += 1;
      topicMap[log.topic].score += log.score || 0;
    });

    return Object.entries(topicMap).map(([topic, stat]) => ({
      topic: topic.length > 16 ? topic.substring(0, 14) + '…' : topic,
      fullTopic: topic,
      accuracy: Math.round((stat.success / stat.total) * 100),
      attempts: stat.total,
      score: stat.score,
    }));
  }, [logs]);

  // Practice Score Progression Data (Chronological)
  const progressionData = useMemo(() => {
    const sorted = [...studentLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let cumulativeScore = 0;

    return sorted.map((log, index) => {
      cumulativeScore += log.score || 0;
      const date = new Date(log.timestamp);
      return {
        step: index + 1,
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        score: log.score || 0,
        cumulativeScore,
        topic: log.topic,
      };
    });
  }, [studentLogs]);

  // Accuracy Pie Data
  const accuracyPieData = [
    { name: 'Mastered (Correct)', value: successfulAttempts || 1, color: '#16A34A' },
    { name: 'Needs Review', value: Math.max(0, totalAttempts - successfulAttempts), color: '#EF4444' },
  ];

  return (
    <div
      id="performance-chart-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="performance-chart-card"
        className="w-full max-w-5xl max-h-[92dvh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800">Student Performance & Mastery Analytics</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase">
                  {student?.level || 'Form 1'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Live learning curve & topic mastery breakdown for <strong className="text-slate-800">{student?.name || 'Kojo Mensah'}</strong>
              </p>
            </div>
          </div>

          <button
            id="close-performance-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overall Accuracy</span>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-800">{overallAccuracy}%</div>
              <div className="text-[10px] text-green-600 font-bold mt-1">
                {successfulAttempts} of {totalAttempts} tasks correct
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Math XP</span>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">{totalScore} PTS</div>
              <div className="text-[10px] text-slate-500 font-medium mt-1">
                Accumulated across modes
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Activities Logged</span>
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-800">{totalAttempts}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-1">
                Across 4 interactive workspaces
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curriculum Level</span>
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-600">{student?.level || 'Form 1 SHS'}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-1">
                WAEC Standards Aligned
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Topic Mastery Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Topic Mastery Breakdown</h3>
                  <p className="text-xs text-slate-500">Success rate (%) per mathematical domain</p>
                </div>
              </div>

              <div className="h-64 w-full">
                {topicMasteryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicMasteryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="topic" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        formatter={(value: any) => [`${value}% Mastery`, 'Accuracy']}
                        labelFormatter={(label) => `Topic: ${label}`}
                      />
                      <Bar dataKey="accuracy" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    No activity logs recorded yet. Practice some challenges!
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Accuracy Ratio Donut */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs flex flex-col">
              <h3 className="font-bold text-sm text-slate-800 mb-1">Accuracy Ratio</h3>
              <p className="text-xs text-slate-500 mb-4">Correct vs. Needs Revision</p>

              <div className="flex-1 min-h-[180px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accuracyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {accuracyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">{overallAccuracy}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  <span>Correct ({successfulAttempts})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Revising ({Math.max(0, totalAttempts - successfulAttempts)})</span>
                </div>
              </div>
            </div>

          </div>

          {/* Chart 3: Cumulative XP Progression Line Chart */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-1">XP Points Growth Over Time</h3>
            <p className="text-xs text-slate-500 mb-4">Cumulative score trajectory across practice sessions</p>

            <div className="h-56 w-full">
              {progressionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} XP`, 'Cumulative XP']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line type="monotone" dataKey="cumulativeScore" stroke="#FB923C" strokeWidth={3} dot={{ r: 4, fill: '#FB923C' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  No practice milestones yet.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Activity Logs Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Recent Practice Entries</h3>
                <p className="text-xs text-slate-500">Detailed records with math representations</p>
              </div>

              {/* Topic Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Topics</option>
                  <option value="Fraction Equivalence">Fraction Equivalence</option>
                  <option value="Unlike Denominators">Unlike Denominators</option>
                  <option value="Number Line Jumps">Number Line Jumps</option>
                  <option value="Market Discount">Market Discount</option>
                  <option value="Fair-Share Kitchen">Fair-Share Kitchen</option>
                  <option value="SHS 1-Min Challenge">SHS 1-Min Challenge</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Topic</th>
                    <th className="py-2.5 px-3">Challenge / Action</th>
                    <th className="py-2.5 px-3">Math Expression</th>
                    <th className="py-2.5 px-3 text-right">XP</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentLogs.slice(0, 8).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-green-600" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200 text-[10px]">
                            <XCircle className="w-3 h-3 text-red-600" /> Try
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{log.topic}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">{log.title}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700">
                        {log.latexExpression ? <MathView latex={log.latexExpression} /> : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-600">+{log.score || 10}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {studentLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No activity records found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Data saved locally on this device • Instant PWA Sync
          </span>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
