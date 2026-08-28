import React, { useState, useMemo } from 'react';
import { ActivityLog, ActivityTopic, FormLevel } from '../types';
import { ShieldCheck, Download, Search, Trash2, Database, KeyRound, CheckCircle2, XCircle, Award, BarChart3 } from 'lucide-react';
import { playSound } from '../utils/audio';
import { MathView } from './MathView';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  onClearLogs: () => void;
  onSeedLogs: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onSeedLogs,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1234') {
      setIsAuthenticated(true);
      setError('');
      playSound('success');
    } else {
      setError('Invalid PIN code. Teacher PIN is 1234.');
      playSound('pop');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTopic = topicFilter === 'ALL' || log.topic === topicFilter;
      const matchesLevel = levelFilter === 'ALL' || log.studentLevel === levelFilter;
      return matchesSearch && matchesTopic && matchesLevel;
    });
  }, [logs, searchQuery, topicFilter, levelFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    if (total === 0) return { total: 0, passRate: 0, uniqueStudents: 0, topicStats: {} as Record<string, { total: number; pass: number }> };

    const successful = logs.filter((l) => l.success).length;
    const uniqueStudents = new Set(logs.map((l) => l.studentName)).size;
    const passRate = Math.round((successful / total) * 100);

    const topicStats: Record<string, { total: number; pass: number }> = {};
    logs.forEach((log) => {
      if (!topicStats[log.topic]) {
        topicStats[log.topic] = { total: 0, pass: 0 };
      }
      topicStats[log.topic].total += 1;
      if (log.success) topicStats[log.topic].pass += 1;
    });

    return { total, passRate, uniqueStudents, topicStats };
  }, [logs]);

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert('No activity logs to export.');
      return;
    }

    const headers = [
      'Timestamp',
      'Student Name',
      'Level',
      'Topic',
      'Activity Title',
      'Details',
      'Result',
      'Score Points',
      'Time Spent (s)',
    ];

    const rows = filteredLogs.map((log) => [
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${log.studentName}"`,
      `"${log.studentLevel}"`,
      `"${log.topic}"`,
      `"${log.title.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      log.success ? '"PASSED / EQUIVALENT"' : '"IN PROGRESS"',
      log.score || 0,
      log.timeSpentSeconds || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SirEugene_MathStudio_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSound('snap');
  };

  return (
    <div id="admin-portal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div id="admin-portal-card" className="w-full max-w-5xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col text-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                Super Admin & Teacher Grading Portal
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                  PIN: 1234
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Sir Eugene Technologies Analytics & Assessment Engine</p>
            </div>
          </div>
          <button
            id="close-admin-portal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Teacher PIN Required</h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter the teacher security PIN code to access student activity logs, analytics, and CSV exports. (Default PIN: <span className="font-mono text-blue-600 font-bold">1234</span>)
            </p>

            {error && (
              <div className="w-full mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <input
                id="admin-pin-input"
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Enter PIN (1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-4 py-3 text-slate-800 focus:outline-none font-bold"
              />
              <button
                id="admin-login-submit-btn"
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider cursor-pointer"
              >
                Authenticate Teacher Access
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Analytics Summary Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Activities</div>
                <div className="text-2xl font-black text-blue-700 mt-1">{stats.total}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Logged sessions</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Rate</div>
                <div className="text-2xl font-black text-green-700 mt-1">{stats.passRate}%</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Accuracy index</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Students</div>
                <div className="text-2xl font-black text-orange-600 mt-1">{stats.uniqueStudents}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Classroom records</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Mode</div>
                <div className="text-base font-bold text-purple-700 mt-1">100% Offline PWA</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">LocalStorage Cached</div>
              </div>
            </div>

            {/* Topic Breakdown Bars */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Topic Mastery Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {Object.entries(stats.topicStats).map(([topic, rawData]) => {
                  const data = rawData as { total: number; pass: number };
                  const pct = Math.round((data.pass / data.total) * 100);
                  return (
                    <div key={topic} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-slate-700 truncate">{topic}</span>
                        <span className="font-bold text-green-700">{pct}% ({data.pass}/{data.total})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="admin-search-input"
                    type="text"
                    placeholder="Search student or activity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <select
                  id="admin-topic-filter"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Topics</option>
                  <option value="Fraction Equivalence">Fraction Equivalence</option>
                  <option value="Unlike Denominators">Unlike Denominators</option>
                  <option value="Number Line Jumps">Number Line Jumps</option>
                  <option value="Decimal Rounding">Decimal Rounding</option>
                  <option value="100-Grid Percentages">100-Grid Percentages</option>
                  <option value="Market Discount">Market Discount</option>
                  <option value="Recipe Proportions">Recipe Proportions</option>
                  <option value="Fair-Share Kitchen">Fair-Share Kitchen</option>
                  <option value="SHS 1-Min Challenge">SHS 1-Min Challenge</option>
                </select>

                <select
                  id="admin-level-filter"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Levels</option>
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="export-csv-btn"
                  onClick={exportToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Logs to CSV
                </button>

                <button
                  id="seed-demo-logs-btn"
                  onClick={() => { onSeedLogs(); playSound('success'); }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-blue-200 cursor-pointer transition-colors shadow-xs"
                  title="Generate sample student records for testing"
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Seed Demo Logs
                </button>

                <button
                  id="clear-all-logs-btn"
                  onClick={() => {
                    if (confirm('Clear all student activity logs in localStorage?')) {
                      onClearLogs();
                      playSound('pop');
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Clear all logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Level</th>
                      <th className="p-3.5">Topic</th>
                      <th className="p-3.5">Activity & Details</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No activity logs found. Complete activities in workspace modes or click "Seed Demo Logs".
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                            {log.studentName}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {log.studentLevel}
                            </span>
                          </td>
                          <td className="p-3.5 text-blue-700 whitespace-nowrap font-bold">
                            {log.topic}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{log.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{log.details}</div>
                            {log.latexExpression && (
                              <div className="mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">
                                <MathView latex={log.latexExpression} />
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1 text-green-800 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-200 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-orange-800 font-bold bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 text-[11px]">
                                <XCircle className="w-3.5 h-3.5 text-orange-600" /> Attempt
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-orange-600 whitespace-nowrap">
                            +{log.score || 0} pts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
