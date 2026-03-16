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

export type serverActionResponse = serverActionFailure | serverActionSuccess;


export function showServerActionResponseToast(result: serverActionResponse) {
  if (!result) return;
  if (result.success) {
    toast.success("Success!");
  } else {
    toast.error(result.error);
  }
}