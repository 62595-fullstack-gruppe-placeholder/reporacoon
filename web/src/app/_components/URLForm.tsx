"use client";

import { FormEvent, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SubmitButton } from "./SubmitButton";
import { createScanJobServerAction, getScanFindingByIdServerAction, getScanJobByIdServerAction, scan, ScanResult } from "@/app/ScanServerActions";
import { CreateScanJobDTO, createScanJobDTOSchema, ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { useScanAction } from "@/lib/hooks/useScanAction";

/**
 * Schema for url form.
 */
export const urlFormSchema = z
    .object({
        url: z.string().url("Invalid URL"),
    });


/**
 * URL form data.
 */
export type URLFormSchema = z.infer<typeof urlFormSchema>;


interface URLFormProps {
    onScanStarted: (finding: ScanFinding[], jobs: ScanJob[]) => void;
    isDeepScan: boolean;
}


export default function URLForm({ onScanStarted, isDeepScan }: URLFormProps) {
    const { execute, isPending } = useScanAction();

    const form = useForm<URLFormSchema>({
        resolver: zodResolver(urlFormSchema),
        defaultValues: { url: "" },
    });

    const onSubmit = form.handleSubmit(async (data) => {
        // Reset immediately for clean state
        form.reset();
        form.clearErrors();

        const input = {
            url: data.url,
            repo_url: data.url,
            owner_id: null,
            priority: 1,
            isDeepScan,
        };

        const result = await execute(input);
        console.log("Form data:", data)

        if (result.success) {
            onScanStarted(result.findings, result.jobs);
            form.reset({ url: "" });
        }
        // Error: toast shows automatically via useServerAction
    });



    return (
        <form onSubmit={onSubmit} className='flex items-center flex-1 w-full gap-8'>
            <input
                id="url"
                type="text"
                {...form.register("url")}
                onChange={() => form.clearErrors("url")}
                className='fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate' placeholder="Paste a GitHub/GitLab URL" />
            {form.formState.errors.url && (
                <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.url.message}
                </p>)}
            <SubmitButton text="Start Scanning" loadingText="Scanning..." loading={isPending} />
        </form>
    )
}