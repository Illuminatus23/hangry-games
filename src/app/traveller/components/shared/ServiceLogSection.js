export function ServiceLogSection({ yearLogs, displayTerm }) {
    if (yearLogs.length === 0) return null;
    return (
        <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold text-foreground">Service Record — Term {displayTerm}:</p>
            {yearLogs.map((log, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {log}</p>
            ))}
        </div>
    );
}
