"use client";

import { FormEvent, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { url } from "inspector";
import { useForm } from "react-hook-form";
import { Island_Moments } from "next/font/google";
import { Loader2 } from "lucide-react";
import { SubmitButton } from "./SubmitButton";
import { createScanJobServerAction } from "@/app/_components/CreateScanJob";
import { createScanJob } from "@/lib/repository/scanJob/scanJobRepository";
import { CreateScanJobDTO, createScanJobDTOSchema, ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";

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


export default function URLForm() {
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const form = useForm<URLFormSchema>({
        resolver: zodResolver(urlFormSchema),
        defaultValues: {
            url: "",
        },
    });

    const onSubmit = form.handleSubmit(async (data) => {
        setIsLoading(true);
        // LOGIC: 
        // 1. Validate that the URL is actually a Github/Gitlab URL
        // 2. Add the URL to a scanjob in the database with a status of "pending"
        // 3. Start the python scraper so it runs all the pending scanjobs in the database
        try {
            const response = await fetch("http://localhost:5001/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: data.url }),
            });

            const input: CreateScanJobDTO = {
                repo_url: data.url,
                owner_id: null, // TODO: Get the actual user ID from the session
                priority: 1, // TODO: Allow the user to set the priority
            };

            const res = await response.json();
            console.log(res);

            if (res.valid === true) {
                console.log("URL is valid, starting scan...");
                // Creating the scan job in the database
                const scanJob = await createScanJobServerAction(input);
                // Starting the scanner, which runs all of the scan jobs currently in the database
                try {
                    const response = await fetch("http://localhost:5001/scan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: data.url }),
                    });
                } catch (err) {
                    console.error(err)
                }

            } else {
                // TODO: show this to the user
                console.log("URL is invalid, please enter a valid GitHub/GitLab URL.");
            }


            form.reset();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    });



    return (
        <form onSubmit={onSubmit} className='flex items-center flex-1 w-full gap-8'>
            <input
                id="url"
                type="url"
                {...form.register("url")}
                className='fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate' placeholder="Paste a GitHub/GitLab URL" />
            {form.formState.errors.url && (
                <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.url.message}
                </p>)}
            <SubmitButton text="Start Scanning" loadingText="Scanning..." />
        </form>
    )
}