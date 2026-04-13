"use client";
import React, { ReactNode } from "react";
import { toast } from "sonner";

interface serverActionSuccess {
    success: true;
    msg: ReactNode;
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
    if (result.msg) {
      toast.info(result.msg);
    } else {
      toast.success("Success!");
    }
  } else {
    toast.error(result.error);
  }
}