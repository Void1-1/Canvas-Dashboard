interface Props {
  message: string;
}

export default function GlassEmptyState({ message }: Props) {
  return (
    <div className="glass p-6 rounded-xl" style={{ background: 'var(--color-surface)' }}>
      <p style={{ color: 'var(--color-muted)' }}>{message}</p>
    </div>
  );
}
