export function SectionCard({ title, description }: { title: string; description: string }) {
  return (
    <section
      style={{
        padding: 28,
        borderRadius: 24,
        border: '1px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{description}</p>
    </section>
  );
}
