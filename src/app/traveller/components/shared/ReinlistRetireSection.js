"use client";
import { Button } from "@/components/ui/button";

export function ReinlistRetireSection({ step, characterName, reinlistLabel, onReinlist, onRetire }) {
    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
                {step === "forced"
                    ? `${characterName} is compelled to remain in service.`
                    : step === "retire"
                        ? `${characterName} has been discharged from service.`
                        : "Service term complete. Reinlist or retire?"}
            </p>
            <div className="flex flex-wrap gap-2">
                {step !== "retire" && (
                    <Button onClick={onReinlist}>{reinlistLabel}</Button>
                )}
                {step !== "forced" && (
                    <Button variant="outline" onClick={onRetire}>Retire</Button>
                )}
            </div>
        </div>
    );
}
