"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SelectOrButton({ allOps, userChoice, setUserChoice, onSubmit }) {
    const hasSingleOption = allOps.length === 1;
    const singleOption = hasSingleOption ? allOps[0] : null;

    if (hasSingleOption && singleOption) {
        return (
            <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => onSubmit(singleOption.value)}>
                    {singleOption.name}
                </Button>
            </div>
        );
    }

    const selectedOp = allOps.find(op => op.value === userChoice);

    return (
        <div className="space-y-2">
            <Select value={userChoice} onValueChange={setUserChoice}>
                <SelectTrigger className="w-64">
                    <SelectValue placeholder="--Select--">
                        {selectedOp ? selectedOp.name : undefined}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {allOps.map((op) => (
                        <SelectItem key={op.id} value={op.value}>
                            {op.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button type="button" onClick={() => onSubmit(userChoice)} disabled={!userChoice}>
                Continue
            </Button>
        </div>
    );
}
