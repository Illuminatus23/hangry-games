"use client";
import { useState, useEffect } from "react";
import CharacterCreation from "./CharacterCreationClient";

export default function Page() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <CharacterCreation />;
}
