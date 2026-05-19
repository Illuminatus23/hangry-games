"use client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function CascadeSkillDialog({ pendingCascade, cascadeChoice, setCascadeChoice, onConfirm }) {
    return (
        <Dialog open={!!pendingCascade} onOpenChange={() => {}} dismissible={false}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Cascade Skill</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground bg-muted border-l-4 border-primary px-3 py-2 rounded-md">
                        You rolled <span className="font-medium text-foreground">{pendingCascade?.parentSkill}</span> — choose a specialization:
                    </p>
                    <Select value={cascadeChoice} onValueChange={setCascadeChoice}>
                        <SelectTrigger>
                            <SelectValue placeholder="-- Select --">
                                {cascadeChoice || undefined}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {(pendingCascade?.options ?? []).map((s, i) => (
                                <SelectItem key={i} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={onConfirm} disabled={!cascadeChoice}>
                        Confirm Skill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
