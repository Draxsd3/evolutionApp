interface StatusScreenProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function StatusScreen({ title, description, action }: StatusScreenProps) {
  return (
    <main className="centered-screen">
      <div className="status-panel" role="status">
        <div className="brand centered-brand"><span>e</span><strong>Evolua</strong></div>
        <h1>{title}</h1>
        <p>{description}</p>
        {action && <button className="primary-action" onClick={action.onClick}>{action.label}</button>}
      </div>
    </main>
  );
}
