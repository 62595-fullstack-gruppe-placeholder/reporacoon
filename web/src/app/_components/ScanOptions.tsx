"use client"

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
    isDisabled: boolean
    onDeepChange?: (isDeep: boolean) => void;
}

export function ScanOptions({ isDisabled, onDeepChange}: Props) {
    const [checkedShallow, setCheckedShallow] = useState(true);
    const [checkedDeep, setCheckedDeep] = useState(false);

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

    const showTooltip = isDisabled;

    return (

        <div className="w-full">

            <FieldGroup className="mx-auto w-full">

                <TooltipProvider>
                    {showTooltip ? (
                        <Tooltip>
                            <Field orientation="horizontal" data-disabled={isDisabled} >
                                <TooltipTrigger asChild >
                                    <div className="w-full flex gap-2">
                                        <Checkbox id="scan-type-shallow" name="scan-type-shallow" checked={checkedShallow} onCheckedChange={onCheckShallow} disabled={isDisabled} />
                                        <FieldContent>
                                            <FieldLabel htmlFor="scan-type-shallow">
                                                Shallow scan
                                            </FieldLabel>
                                            <FieldDescription>
                                                This scan will scan all files in the main branch. Ignores other branches and
                                                doesn't search through history
                                            </FieldDescription>
                                        </FieldContent>
                                        <Checkbox id="scan-type-deep" name="scan-type-deep" checked={checkedDeep} onCheckedChange={onCheckDeep} disabled={isDisabled} />
                                        <FieldContent>
                                            <FieldLabel htmlFor="scan-type-deep">
                                                Deep scan
                                            </FieldLabel>
                                            <FieldDescription>
                                                This scan will scan all files in all branches and through the history of the reposity. Deep scan is slower, but more thourugh
                                            </FieldDescription>
                                        </FieldContent>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent >
                                    Log in to use the deep scan
                                </TooltipContent>
                            </Field>
                        </Tooltip>
                    ) : (<div className="w-full flex gap-2">
                        <Checkbox id="scan-type-shallow" name="scan-type-shallow" checked={checkedShallow} onCheckedChange={onCheckShallow} disabled={isDisabled} />
                        <FieldContent>
                            <FieldLabel htmlFor="scan-type-shallow">
                                Shallow scan
                            </FieldLabel>
                            <FieldDescription>
                                This scan will scan all files in the main branch. Ignores other branches and
                                doesn't search through history
                            </FieldDescription>
                        </FieldContent>
                        <Checkbox id="scan-type-deep" name="scan-type-deep" checked={checkedDeep} onCheckedChange={onCheckDeep} disabled={isDisabled} />
                        <FieldContent>
                            <FieldLabel htmlFor="scan-type-deep">
                                Deep scan
                            </FieldLabel>
                            <FieldDescription>
                                This scan will scan all files in all branches and through the history of the reposity. Deep scan is slower, but more thorough
                            </FieldDescription>
                        </FieldContent>
                    </div>)}
                </TooltipProvider>
            </FieldGroup>
        </div>
    )
}