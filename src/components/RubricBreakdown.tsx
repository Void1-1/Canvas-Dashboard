type RubricCriterion = {
  id: string;
  description: string;
  long_description?: string;
  points: number;
  ratings?: { id: string; description: string; points: number }[];
};

type RubricAssessmentEntry = {
  points?: number | null;
  comments?: string | null;
  rating_id?: string | null;
};

type RubricAssessment = {
  [criterionId: string]: RubricAssessmentEntry;
};

export default function RubricBreakdown({
  rubric,
  rubricAssessment,
}: {
  rubric: RubricCriterion[];
  rubricAssessment?: RubricAssessment | null;
}) {
  const totalPossible = rubric.reduce((sum, c) => sum + (c.points ?? 0), 0);
  const totalEarned = rubricAssessment
    ? rubric.reduce((sum, c) => {
        const pts = rubricAssessment[c.id]?.points;
        return pts != null ? sum + pts : sum;
      }, 0)
    : null;

  return (
    <div
      className="border-t px-4 md:px-5 py-4"
      style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.03)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-muted)' }}
        >
          Rubric
        </p>
        {totalEarned !== null && (
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
            {totalEarned} / {totalPossible} pts
          </p>
        )}
      </div>
      <div className="space-y-3">
        {rubric.map((criterion) => {
          const assessment = rubricAssessment?.[criterion.id];
          const earnedPoints = assessment?.points ?? null;
          const hasScore = earnedPoints !== null && earnedPoints !== undefined;
          const ratingDesc = assessment?.rating_id
            ? criterion.ratings?.find((r) => r.id === assessment.rating_id)?.description
            : null;

          return (
            <div
              key={criterion.id}
              className="flex items-start justify-between gap-4 py-2 border-b last:border-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium leading-snug"
                  style={{ color: 'var(--color-text)' }}
                >
                  {criterion.description}
                </p>
                {ratingDesc && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {ratingDesc}
                  </p>
                )}
                {assessment?.comments && (
                  <p className="text-xs mt-1 italic" style={{ color: 'var(--color-muted)' }}>
                    &ldquo;{assessment.comments}&rdquo;
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 pt-0.5">
                {hasScore ? (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {earnedPoints} / {criterion.points}
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    — / {criterion.points}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
