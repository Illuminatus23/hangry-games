"use client";
import { Button } from "@/components/ui/button";

export function SkillPickSection({ availablePools, pendingSkillResult, currentYear, onTableSelect, onSkillConfirm }) {
    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Skills check passed. Choose a table to roll on:</p>
            <div className="flex flex-wrap gap-2">
                {availablePools.map(pool => (
                    <Button
                        key={pool.name}
                        onClick={() => onTableSelect(pool)}
                        disabled={pendingSkillResult !== null}
                    >
                        {pool.name}
                    </Button>
                ))}
            </div>
            {pendingSkillResult && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Rolled <span className="font-semibold text-foreground">{pendingSkillResult.roll}</span>
                        {pendingSkillResult.mod > 0 && <span> (DM+{pendingSkillResult.mod})</span>}
                        {" "}on {pendingSkillResult.tableName}:{" "}
                        <span className="font-semibold text-foreground">{pendingSkillResult.skill}</span>
                    </p>
                    <Button onClick={onSkillConfirm}>
                        {currentYear < 4
                            ? `Accept & Continue to Year ${currentYear + 1}`
                            : "Accept & Resolve Term"}
                    </Button>
                </div>
            )}
        </div>
    );
}
