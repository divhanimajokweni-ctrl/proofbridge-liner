// app/components/PageGuide.tsx
// Reusable "how this page works" strip. This is the component that
// should have shipped on Pools the first time: a small, always-visible
// guide anchored to the page, not a placeholder or a nav label.
import '../styles/dashboard-shell.css';

export function PageGuide({ index = 1, title, children }: { index?: number; title: string; children: React.ReactNode }) {
  return (
    <div className="vvu-guide">
      <span className="vvu-guide-index">{index}</span>
      <div className="vvu-guide-body">
        <span className="vvu-guide-title">{title}</span>
        <p className="vvu-guide-text">{children}</p>
      </div>
    </div>
  );
}
