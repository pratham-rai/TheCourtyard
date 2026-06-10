// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\coach\page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar, BottomNav, Footer } from '@/components/Navigation';
import { Award, Calendar, Clock, Shield, User, HelpCircle, Bell, ArrowUpRight, LogOut, RefreshCw, CheckCircle, Sliders, MessageSquare, Plus, ChevronRight, TrendingUp } from 'lucide-react';

const formatDateDMY = (dateInput) => {
  if (!dateInput) return '';
  const dateStr = String(dateInput);
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function CoachPortal() {
  const router = useRouter();
  const { user, token, API_BASE_URL, logout, showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  
  // Progress Form State
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [evalRemarks, setEvalRemarks] = useState('');
  const [skills, setSkills] = useState({
    footwork: 3,
    serve: 3,
    dinking: 3,
    backhand: 3,
    stamina: 3
  });
  const [submittingEval, setSubmittingEval] = useState(false);

  async function fetchCoachData() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/coach/my-students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setEnrollments(data.enrollments || []);
        if (data.courses && data.courses.length > 0) {
          setSelectedCourse(data.courses[0]);
        }
      } else {
        showToast('Failed to fetch roster details.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to coach database.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token && !loading) {
      router.push('/auth');
    } else if (user && user.role !== 'coach' && user.role !== 'admin') {
      router.push('/dashboard');
    } else {
      fetchCoachData();
    }
  }, [token, user, router]);

  const handleOpenEval = (student) => {
    setSelectedStudent(student);
    setEvalRemarks('');
    // Prefill with latest skill metrics if available, otherwise default to 3
    const logs = student.progressLogs || [];
    if (logs.length > 0) {
      const latest = logs[logs.length - 1].skills || {};
      setSkills({
        footwork: latest.footwork || 3,
        serve: latest.serve || 3,
        dinking: latest.dinking || 3,
        backhand: latest.backhand || 3,
        stamina: latest.stamina || 3
      });
    } else {
      setSkills({ footwork: 3, serve: 3, dinking: 3, backhand: 3, stamina: 3 });
    }
    setEvalDate(new Date().toISOString().split('T')[0]);
    setIsEvalOpen(true);
  };

  const handleSkillChange = (skill, val) => {
    setSkills(prev => ({
      ...prev,
      [skill]: parseInt(val, 10)
    }));
  };

  const handleSubmitEval = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setSubmittingEval(true);
    try {
      const res = await fetch(`${API_BASE_URL}/coach/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enrollmentId: selectedStudent._id,
          date: evalDate,
          remarks: evalRemarks,
          skills
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit student evaluation');
      }

      showToast('Student check-in evaluation completed successfully!', 'success');
      setIsEvalOpen(false);
      
      // Reload entire coach data to reflect skill progress immediately
      await fetchCoachData();

      // Refresh the selected student view
      if (selectedStudent) {
        const updatedStudent = data.enrollment || selectedStudent;
        // Re-populate user details as the populated response may just be raw MongoDB IDs
        const found = enrollments.find(e => e._id === selectedStudent._id);
        if (found) {
          updatedStudent.user = found.user;
          updatedStudent.course = found.course;
        }
        setSelectedStudent(updatedStudent);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingEval(false);
    }
  };

  // Filter enrollments for the selected course
  const filteredStudents = selectedCourse 
    ? enrollments.filter(e => e.course && e.course._id === selectedCourse._id)
    : [];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-sport-dark text-white">
      <Navbar />

      <section className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <span className="text-[10px] text-neon-green uppercase tracking-widest font-black flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Instructor Workspace Gate
            </span>
            <h1 className="text-3xl font-black uppercase tracking-wider mt-1.5">
              Coach Academy Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
              Lead sessions, evaluate competencies, and update skill sliders in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCoachData}
              className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:text-neon-green transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel p-16 rounded-2xl text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <RefreshCw className="w-4.5 h-4.5 animate-spin text-neon-green" />
            Connecting instructor roster feeds...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT PANEL: Course list & Students Roster */}
            <div className="lg:col-span-4 space-y-6">
              {/* Courses list */}
              <div className="glass-panel p-5 rounded-2xl border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider mb-4 text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neon-green" />
                  Your Assigned Programs
                </h3>
                {courses.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3">No active training courses assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map(course => {
                      const isSelected = selectedCourse?._id === course._id;
                      return (
                        <button
                          key={course._id}
                          onClick={() => {
                            setSelectedCourse(course);
                            setSelectedStudent(null);
                          }}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-white/5 border-neon-green/30 text-neon-green shadow-lg shadow-neon-green/5' 
                              : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                          }`}
                        >
                          <h4 className="font-extrabold text-sm uppercase tracking-wide truncate">{course.title}</h4>
                          <p className="text-[10px] opacity-75 font-medium mt-1 truncate">{course.schedule}</p>
                          <div className="flex items-center gap-3 mt-2 text-[9px] uppercase font-bold tracking-widest">
                            <span className="text-electric-blue">{course.duration}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">Cap: {course.slotsTotal} spots</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Enrolled Students Roster */}
              <div className="glass-panel p-5 rounded-2xl border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider mb-4 text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-neon-green" />
                  Student Roster ({filteredStudents.length})
                </h3>
                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3">No students currently enrolled in this course.</p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredStudents.map(student => {
                      const isSelected = selectedStudent?._id === student._id;
                      return (
                        <button
                          key={student._id}
                          onClick={() => setSelectedStudent(student)}
                          className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-white/5 border-electric-blue/30 text-electric-blue font-bold'
                              : 'bg-black/10 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                          }`}
                        >
                          <div className="flex-1 truncate pr-2">
                            <span className="block text-xs font-extrabold uppercase tracking-wide truncate">
                              {student.user?.name || 'Unknown Student'}
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase font-semibold">
                              {student.user?.membership || 'None'} Member
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Student Details & Progress Sheets */}
            <div className="lg:col-span-8">
              {selectedStudent ? (
                <div className="glass-panel p-6 md:p-8 rounded-2xl border-white/5 space-y-8">
                  {/* Student Title banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-electric-blue/10 border border-electric-blue/20 text-electric-blue text-[9px] font-bold uppercase tracking-wider">
                          Active Learner
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          ID: {selectedStudent._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-wider mt-1.5">
                        {selectedStudent.user?.name}
                      </h2>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedStudent.user?.email}</p>
                    </div>

                    <button
                      onClick={() => handleOpenEval(selectedStudent)}
                      className="px-5 py-3 rounded-xl bg-neon-green hover:bg-neon-green/90 text-charcoal font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-neon-green/10 hover:scale-102 transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add Evaluation / Check-in
                    </button>
                  </div>

                  {/* Core Skill Levels (Latest Check-in Metrics) */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-neon-green" />
                      Current Skills Matrix
                    </h3>
                    
                    {selectedStudent.progressLogs && selectedStudent.progressLogs.length > 0 ? (
                      (() => {
                        const latestLog = selectedStudent.progressLogs[selectedStudent.progressLogs.length - 1];
                        const skills = latestLog.skills || {};
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries({
                              footwork: 'Footwork & Mobility',
                              serve: 'Serve & Target Depth',
                              dinking: 'Kitchen Finesse & Dinking',
                              backhand: 'Baseline Backhand Controls',
                              stamina: 'Stamina & Roster Endurance'
                            }).map(([key, label]) => {
                              const score = skills[key] || 3;
                              return (
                                <div key={key} className="bg-black/25 p-4 rounded-xl border border-white/5">
                                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                                    <span className="text-gray-400">{label}</span>
                                    <span className="text-neon-green">{score} / 5</span>
                                  </div>
                                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-electric-blue to-neon-green h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${(score / 5) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="bg-black/20 p-5 rounded-xl border border-white/5 text-center text-xs text-gray-400">
                        No progress metrics logged yet. Record a first check-in to initialize their parameters!
                      </div>
                    )}
                  </div>

                  {/* Progress Logs list */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-neon-green" />
                      Instructor Performance Ledger
                    </h3>
                    
                    {!selectedStudent.progressLogs || selectedStudent.progressLogs.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-2">No past logs logged for this student.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                        {[...selectedStudent.progressLogs].reverse().map((log, index) => (
                          <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-electric-blue uppercase">
                                  {formatDateDMY(log.date)}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                  Check-in attendance recorded
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 font-medium">
                                {log.remarks || 'No progress comments added.'}
                              </p>
                            </div>
                            <div className="flex gap-2.5 shrink-0">
                              {Object.entries(log.skills || {}).map(([key, score]) => (
                                <div key={key} className="text-center bg-black/40 px-2 py-1 rounded border border-white/5">
                                  <span className="block text-[8px] text-gray-500 uppercase font-black tracking-widest">{key.slice(0, 3)}</span>
                                  <span className="text-[10px] text-neon-green font-bold font-mono">{score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-16 rounded-2xl text-center border-white/5 flex flex-col items-center justify-center text-gray-400">
                  <Award className="w-12 h-12 text-white/10 mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Select a Student</h3>
                  <p className="text-xs mt-1 max-w-sm">
                    Pick a student profile from the roster on the left to evaluate their attendance and skill progressions.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </section>

      {/* EVALUATION DRAWER MODAL */}
      {isEvalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-charcoal border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-neon-green uppercase tracking-widest font-black block">Class Performance Ledger</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  Evaluate {selectedStudent.user?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEvalOpen(false)}
                className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEval} className="p-6 space-y-6">
              {/* Checkin Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Session Date</label>
                <div className="relative w-full">
                  <input
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl py-3 px-4 text-xs text-transparent placeholder-gray-500 outline-none font-mono"
                    style={{ color: 'transparent' }}
                    required
                  />
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white font-bold text-xs">
                    {formatDateDMY(evalDate) || 'Select Date'}
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold border-b border-white/5 pb-2">Competency Sliders (1 - 5 Scale)</h4>
                
                {Object.entries({
                  footwork: 'Footwork & On-court Speed',
                  serve: 'Serve Power & Precision',
                  dinking: 'Kitchen Finesse & Drops',
                  backhand: 'Backhand Depth Controls',
                  stamina: 'Reflex Stamina & Longevity'
                }).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span className="text-gray-300 font-semibold">{label}</span>
                      <span className="text-neon-green font-mono">{skills[key]} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={skills[key]}
                      onChange={(e) => handleSkillChange(key, e.target.value)}
                      className="w-full accent-neon-green bg-black/40 border border-transparent h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Remarks Text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Evaluation Remarks</label>
                <textarea
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  placeholder="Excellent third-shot drop consistency today. Needs minor paddle tilt adjustments on rapid baseline backhand speedups..."
                  rows="3"
                  className="w-full bg-black/40 border border-white/10 focus:border-neon-green/50 rounded-xl p-4 text-xs text-white placeholder-gray-500 outline-none resize-none transition-all duration-300"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEvalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEval}
                  className="flex-1 py-3 rounded-xl bg-neon-green hover:bg-neon-green/90 text-charcoal font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-neon-green/5 hover:scale-102 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submittingEval ? 'Saving...' : 'Lock Competencies'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
