"use client"

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { extensionsUtil } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
    onSelectedChange: (selected: Set<string>) => void;
    extensions: Set<string>;
}

export function IgnoreSettingsButtons({ onSelectedChange, extensions }: Props) {
    const [isSettingsShown, setIsSettingsShown] = useState(false);
    const [selected, setSelected] = useState(new Set<string>());
    const allExtensions = extensionsUtil;

    // Initialize selected state from extensions prop on mount/update
    useEffect(() => {
        setSelected(extensions);
    }, [extensions]);

    const toggleExt = (ext: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(ext)) {
            newSelected.delete(ext);
        } else {
            newSelected.add(ext);
        }
        setSelected(newSelected);

        // Returns extensions to SCAN (not ignore) - unchecked = scan
        let difference = new Set([...allExtensions].filter(x => newSelected.has(x)));
        onSelectedChange(difference);
    };

    return (
        <div className="w-full border-t border-secondary/10 bg-background/50 p-4">
            <div
                className="flex w-full items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors border-secondary/10"
                onClick={() => setIsSettingsShown(!isSettingsShown)}>
                <div className="flex items-center gap-4">
                    <h2 className="h2">Ignore settings</h2>
                </div>
                <div className={`transition-transform duration-300 ${isSettingsShown ? 'rotate-180' : ''}`}>
                    <ChevronDown size={24} className="text-secondary" />
                </div>
            </div>
            {isSettingsShown && (
                <div className="space-y-4 py-6">
                    <div className="flex flex-wrap gap-2">
                        {Array.from(allExtensions).map(ext => {
                            const id = `ext-${ext}`;
                            const isChecked = selected.has(ext); 
                            return (
                                <label key={ext} className="inline-flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        id={id}
                                        name={id}
                                        checked={isChecked}
                                        onCheckedChange={() => toggleExt(ext)}
                                    />
                                    <Label htmlFor={id}>{ext}</Label>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}