interface Props {
  state: string | undefined | null;
  className?: string;
}

export default function SubmissionStatusBadge({ state, className = '' }: Props) {
  if (state === 'graded') {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}
        style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(22,163,74)' }}
      >
        Graded
      </span>
    );
  }
  if (state === 'submitted') {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}
        style={{ background: 'rgba(59,130,246,0.12)', color: 'rgb(37,99,235)' }}
      >
        Submitted
      </span>
    );
  }
  if (state === 'pending_review') {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}
        style={{ background: 'rgba(234,179,8,0.12)', color: 'rgb(161,128,0)' }}
      >
        Pending Grading
      </span>
    );
  }
  if (!state || state === 'unsubmitted') {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}
        style={{ background: 'rgba(156,163,175,0.15)', color: 'rgb(107,114,128)' }}
      >
        Not Submitted
      </span>
    );
  }
  return null;
}
