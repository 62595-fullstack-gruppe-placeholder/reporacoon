"use client"

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
    isDisabled: boolean,
    isDeep: boolean,
    onDeepChange?: (isDeep: boolean) => void;
}

export function ScanOptions({ isDisabled, isDeep = false, onDeepChange }: Props) {
    const [checkedShallow, setCheckedShallow] = useState(!isDeep);
    const [checkedDeep, setCheckedDeep] = useState(isDeep);

    useEffect(() => {
        setCheckedShallow(!isDeep);
        setCheckedDeep(isDeep);
    }, [isDeep]);

    const onCheckDeep = () => {
        setCheckedDeep(true);
        setCheckedShallow(false);
        onDeepChange?.(true);
    }

    const onCheckShallow = () => {
        setCheckedDeep(false);
        setCheckedShallow(true);
        onDeepChange?.(false);
    }

    const options = [
        {
            id: "shallow",
            label: "Shallow scan",
            description: "Scans all files in the main branch. Ignores other branches and doesn't search through history.",
            badge: "Default",
            badgeClass: "bg-background text-secondary border border-border",
            checked: checkedShallow,
            onChecked: onCheckShallow,
            checkboxDisabled: false,
        },
        {
            id: "deep",
            label: "Deep scan",
            description: "Scans all files in all branches and through the history of the repository. Deep scan is slower, but more thorough.",
            badge: "Guardian+",
            badgeClass: "bg-button-main/10 text-button-main border border-button-main/30",
            checked: checkedDeep,
            onChecked: onCheckDeep,
            checkboxDisabled: isDisabled,
        },
    ];

    return (
        <div className="w-full">
            <FieldGroup className="mx-auto w-full">
                <TooltipProvider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        {options.map((opt) => {
                            const card = (
                                <div
                                    key={opt.id}
                                    onClick={() => !opt.checkboxDisabled && opt.onChecked()}
                                    className={`
                                        relative flex gap-3 items-start p-4 rounded-[10px] border transition-all
                                        bg-box cursor-pointer select-none
                                        ${opt.checked
                                            ? "border-button-main"
                                            : "border-border hover:border-secondary/50"}
                                        ${opt.checkboxDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                    `}
                                >
                                    {/* Hidden real checkbox for form semantics */}
                                    <Checkbox
                                        id={`scan-type-${opt.id}`}
                                        name={`scan-type-${opt.id}`}
                                        checked={opt.checked}
                                        onCheckedChange={opt.onChecked}
                                        disabled={opt.checkboxDisabled}
                                        className="sr-only"
                                    />

                                    {/* Visual checkbox */}
                                    <div
                                        className={`
                                            mt-0.5 w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-all
                                            ${opt.checked
                                                ? "bg-button-main border-button-main"
                                                : "bg-transparent border-secondary"}
                                        `}
                                    >
                                        {opt.checked && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5">
                                                <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                                            </svg>
                                        )}
                                    </div>

                                    <Field orientation="vertical" className="flex-1 gap-0">
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={`scan-type-${opt.id}`}
                                                className="text-text-main text-sm font-mono font-bold mb-1 cursor-pointer"
                                            >
                                                {opt.label}
                                            </FieldLabel>
                                            <FieldDescription className="text-secondary text-xs font-mono leading-relaxed mb-2">
                                                {opt.description}
                                            </FieldDescription>
                                        </FieldContent>
                                        <span className={`inline-block self-start text-[10px] font-mono px-2 py-0.5 rounded-[4px] tracking-wide ${opt.badgeClass}`}>
                                            {opt.badge}
                                        </span>
                                    </Field>
                                </div>
                            );

                            if (opt.checkboxDisabled) {
                                return (
                                    <Tooltip key={opt.id}>
                                        <TooltipTrigger asChild>
                                            <div>{card}</div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-box border border-border text-text-main text-xs font-mono">
                                            Log in to use the deep scan
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return card;
                        })}
                    </div>
                </TooltipProvider>
            </FieldGroup>
        </div>
    );
}