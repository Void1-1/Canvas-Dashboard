'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import { getLetterGrade, getGradeColor } from '@/lib/gradeUtils';
import GlassEmptyState from './GlassEmptyState';
import RubricBreakdown from './RubricBreakdown';

type CourseGrade = {
  currentScore?: number | null;
  finalScore?: number | null;
  currentGrade?: string | null;
  finalGrade?: string | null;
};

type GradingPeriod = {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
};

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export default function ClassGradesView({
  grades,
  courseGrade,
  gradingPeriods = [],
}: {
  grades: any[];
  courseGrade?: CourseGrade | null;
  gradingPeriods?: GradingPeriod[];
}) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [whatIfScores, setWhatIfScores] = useState<{ [id: string]: string }>({});
  const [expandedRubrics, setExpandedRubrics] = useState<Set<number>>(new Set());

  // Filter assignments by grading period using due date
  const filteredGrades = useMemo(() => {
    if (!selectedPeriodId) return grades;
    const period = gradingPeriods.find((p) => p.id === selectedPeriodId);
    if (!period) return grades;
    const start = period.start_date ? new Date(period.start_date) : null;
    const end = period.end_date ? new Date(period.end_date) : null;
    return grades.filter((a) => {
      if (!a.due_at) return false;
      const due = new Date(a.due_at);
      if (start && due < start) return false;
      if (end && due > end) return false;
      return true;
    });
  }, [grades, selectedPeriodId, gradingPeriods]);

  // Stats from filtered set
  const gradedAssignments = filteredGrades.filter(
    (a) => a.submission?.score !== null && a.submission?.score !== undefined && a.points_possible
  );
  const totalEarned = gradedAssignments.reduce((sum, a) => sum + (a.submission?.score ?? 0), 0);
  const totalPossible = filteredGrades.reduce((sum, a) => sum + (a.points_possible ?? 0), 0);
  const computedPercent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null;

  // What-If calculation
  const whatIfEarned = filteredGrades.reduce((sum, a) => {
    const score = a.submission?.score ?? null;
    if (score !== null) return sum + score;
    const hyp = whatIfScores[String(a.id)];
    if (hyp !== undefined && hyp !== '') return sum + parseFloat(hyp || '0');
    return sum;
  }, 0);
  const whatIfPossible = filteredGrades.reduce((sum, a) => {
    const score = a.submission?.score ?? null;
    if (score !== null) return sum + (a.points_possible ?? 0);
    const hyp = whatIfScores[String(a.id)];
    if (hyp !== undefined && hyp !== '') return sum + (a.points_possible ?? 0);
    return sum;
  }, 0);
  const whatIfPercent = whatIfMode && whatIfPossible > 0 ? (whatIfEarned / whatIfPossible) * 100 : null;

  // Display grade — prefer official when showing all periods
  const displayScore =
    selectedPeriodId == null
      ? (courseGrade?.currentScore ?? courseGrade?.finalScore ?? computedPercent)
      : computedPercent;
  const displayGrade =
    selectedPeriodId == null
      ? (courseGrade?.currentGrade ?? courseGrade?.finalGrade ?? (displayScore != null ? getLetterGrade(displayScore) : null))
      : displayScore != null
      ? getLetterGrade(displayScore)
      : null;
  const gradeColor = displayScore != null ? getGradeColor(displayScore) : 'var(--color-muted)';

  function toggleRubric(id: number) {
    setExpandedRubrics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <motion.h1
            className="text-xl md:text-2xl font-semibold"
            style={{ color: 'var(--color-text)' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Grades
          </motion.h1>
          <div className="flex flex-wrap gap-2 items-center">
            {gradingPeriods.length > 0 && (
              <select
                value={selectedPeriodId ?? ''}
                onChange={(e) =>
                  setSelectedPeriodId(e.target.value ? Number(e.target.value) : null)
                }
                className="text-sm rounded-lg px-3 py-1.5 border"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <option value="">All Grading Periods</option>
                {gradingPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setWhatIfMode((m) => !m);
                if (whatIfMode) setWhatIfScores({});
              }}
              className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors border"
              style={{
                background: whatIfMode ? 'var(--color-accent)' : 'var(--color-surface)',
                color: whatIfMode ? '#fff' : 'var(--color-text)',
                borderColor: whatIfMode ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              What-If Grades
            </button>
          </div>
        </div>

        {/* Overall grade card */}
        {(displayScore != null || displayGrade) && (
          <motion.div
            className="glass p-5 md:p-6 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: 'var(--color-surface)', borderLeft: `4px solid ${gradeColor}` }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                {selectedPeriodId
                  ? (gradingPeriods.find((p) => p.id === selectedPeriodId)?.title ?? 'Grading Period') + ' Grade'
                  : 'Overall Course Grade'}
              </p>
              {displayScore != null && (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold" style={{ color: gradeColor }}>
                      {displayGrade}
                    </span>
                    <span className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      {displayScore.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-border)', maxWidth: '320px' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: gradeColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, displayScore)}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </>
              )}
              {displayScore == null && displayGrade && (
                <span className="text-3xl font-bold" style={{ color: gradeColor }}>
                  {displayGrade}
                </span>
              )}
            </div>
            {totalPossible > 0 && (
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                <p>
                  {totalEarned.toFixed(1)} / {totalPossible} pts
                </p>
                <p className="text-xs mt-1">
                  {gradedAssignments.length} graded assignment
                  {gradedAssignments.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* What-If grade preview */}
        <AnimatePresence>
          {whatIfMode && whatIfPercent !== null && (
            <motion.div
              className="glass p-4 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.08)', borderLeft: '4px solid var(--color-accent)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-accent)' }}>
                What-If Grade
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span
                  className="text-2xl font-bold"
                  style={{ color: getGradeColor(whatIfPercent) }}
                >
                  {getLetterGrade(whatIfPercent)}
                </span>
                <span className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {whatIfPercent.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  ({whatIfEarned.toFixed(1)} / {whatIfPossible} pts)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredGrades.length === 0 ? (
          <GlassEmptyState
            message={
              selectedPeriodId
                ? 'No assignments in this grading period.'
                : 'No assignments found for this course.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredGrades.map((assignment: any, index: number) => {
              const submission = assignment.submission;
              const hasScore =
                submission && submission.score !== null && submission.score !== undefined;
              const isExcused = submission?.excused === true;
              const isLate = submission?.late === true && !isExcused;
              const isMissing = submission?.missing === true;
              const isDropped = submission?.dropped === true;
              const hasRubric =
                Array.isArray(assignment.rubric) && assignment.rubric.length > 0;
              const rubricExpanded = expandedRubrics.has(assignment.id);
              const percent =
                hasScore && assignment.points_possible
                  ? (submission.score / assignment.points_possible) * 100
                  : null;
              const scoreColor =
                percent != null ? getGradeColor(percent) : 'var(--color-text)';
              const hasStatusBadge = isLate || isMissing || isExcused || isDropped;

              return (
                <motion.div
                  key={assignment.id}
                  className="glass rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-surface)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left: name, due, status badges */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-base mb-1 leading-snug"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {assignment.name || 'Unknown Assignment'}
                        </h3>
                        {assignment.due_at && (
                          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
                            Due: {new Date(assignment.due_at).toLocaleString()}
                          </p>
                        )}
                        {hasStatusBadge && (
                          <div className="flex flex-wrap gap-1.5">
                            {isLate && (
                              <StatusBadge
                                label="Late"
                                color="rgb(217,119,6)"
                                bg="rgba(245,158,11,0.12)"
                              />
                            )}
                            {isMissing && (
                              <StatusBadge
                                label="Missing"
                                color="rgb(220,38,38)"
                                bg="rgba(239,68,68,0.12)"
                              />
                            )}
                            {isExcused && (
                              <StatusBadge
                                label="Excused"
                                color="rgb(37,99,235)"
                                bg="rgba(59,130,246,0.12)"
                              />
                            )}
                            {isDropped && (
                              <StatusBadge
                                label="Dropped"
                                color="rgb(107,114,128)"
                                bg="rgba(156,163,175,0.15)"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: score / what-if input + rubric toggle */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                        {isExcused ? (
                          <span
                            className="text-base font-semibold"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            Excused
                          </span>
                        ) : whatIfMode && !hasScore && assignment.points_possible ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={assignment.points_possible}
                              placeholder="?"
                              value={whatIfScores[String(assignment.id)] ?? ''}
                              onChange={(e) =>
                                setWhatIfScores((prev) => ({
                                  ...prev,
                                  [String(assignment.id)]: e.target.value,
                                }))
                              }
                              className="w-20 text-sm text-right rounded-lg px-2 py-1 border"
                              style={{
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                borderColor: 'var(--color-accent)',
                              }}
                            />
                            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                              / {assignment.points_possible}
                            </span>
                          </div>
                        ) : hasScore ? (
                          <>
                            {assignment.points_possible ? (
                              <>
                                <span
                                  className="text-base font-bold"
                                  style={{ color: scoreColor }}
                                >
                                  {submission.score} / {assignment.points_possible}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--color-muted)' }}
                                >
                                  {percent!.toFixed(1)}%
                                </span>
                              </>
                            ) : (
                              <span
                                className="text-base font-bold"
                                style={{ color: 'var(--color-text)' }}
                              >
                                {submission.grade ?? submission.score}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                            {assignment.points_possible
                              ? `— / ${assignment.points_possible}`
                              : 'Not graded'}
                          </span>
                        )}

                        {hasRubric && (
                          <button
                            onClick={() => toggleRubric(assignment.id)}
                            className="text-xs flex items-center gap-1 mt-0.5"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            <span>{rubricExpanded ? '▲' : '▼'}</span>
                            <span>Rubric</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rubric breakdown */}
                  <AnimatePresence>
                    {hasRubric && rubricExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <RubricBreakdown
                          rubric={assignment.rubric}
                          rubricAssessment={submission?.rubric_assessment}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}
