"use client";

import { FormEvent, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { url } from "inspector";
import { useForm } from "react-hook-form";

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
        try {
            const response = await fetch("http://localhost:5001/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: data.url }),
            });


            const res = await response.json();
            console.log(res);

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
            <button type="submit" className='btn bg-button-main'> Start Scanning </button>
        </form>
    )
}