"use client";
import { useTransition, useCallback } from "react";
import { serverActionError, showServerActionErrorToast } from "../serverActionError";


export function useServerAction<T extends (...args: any[]) => Promise<serverActionError>>(
  action: T
) {
  const [isPending, startTransition] = useTransition();

  const execute = useCallback(async (...args: Parameters<T>): Promise<serverActionError> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await action(...args);
        showServerActionErrorToast(result);
        resolve(result);
      });
    });
  }, [action]);

  return { execute, isPending };
}