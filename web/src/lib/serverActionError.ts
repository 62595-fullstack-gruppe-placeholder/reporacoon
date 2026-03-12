"use client";
import { toast } from "sonner";

interface serverActionSuccess {
    success: true;
    error: undefined;
}

interface serverActionFailure {
    success: false;
    error: string;
}

export type serverActionError = serverActionFailure | serverActionSuccess;


export function showServerActionErrorToast(result: serverActionError) {
  if (result.success) {
    toast.success("Success!");
  } else {
    toast.error(result.error);
  }
}