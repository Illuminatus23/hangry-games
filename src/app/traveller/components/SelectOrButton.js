export default function SelectOrButton({
    allOps,
    userChoice,
    setUserChoice,
    onSubmit, // call this when user has made a choice
}) {
    const hasSingleOption = allOps.length === 1;
    const singleOption = hasSingleOption ? allOps[0] : null;

    if (hasSingleOption && singleOption) {
        // === Single-option mode: show buttons instead of a <select> ===
        return (
            <div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        className="mt-btn"
                        onClick={() => {
                            onSubmit(singleOption.value);
                        }}
                    >
                        {singleOption.name}
                    </button>
                </div>
            </div>
        );
    }

    // === Normal mode: multiple options, show <select> + Continue button ===
    return (
        <div>
            <div>
                <select
                    style={{ marginBottom: "0.5rem" }}
                    className="mt-select mt-cap"
                    value={userChoice}
                    onChange={(e) => setUserChoice(e.target.value)}
                >
                    <option value="" disabled>
                        --Select--
                    </option>
                    {allOps.length !== 0 &&
                        allOps.map((op) => (
                            <option key={op.id} value={op.value}>
                                {op.name}
                            </option>
                        ))}
                </select>
            </div>
            <button
                className="mt-btn"
                type="button"
                onClick={() => onSubmit(userChoice)}
            >
                Continue
            </button>
        </div>
    );
}
