"use client";
import { useTransition, useCallback } from "react";
import { serverActionResponse, showServerActionResponseToast } from "../serverActionError";


export function useServerAction<T extends (...args: any[]) => Promise<any>>(
  action: T
) {
  const [isPending, startTransition] = useTransition();

  const execute = useCallback(async (...args: Parameters<T>): Promise<serverActionResponse> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await action(...args);
        showServerActionResponseToast(result);
        resolve(result);
      });
    });
  }, [action]);

  return { execute, isPending };
}