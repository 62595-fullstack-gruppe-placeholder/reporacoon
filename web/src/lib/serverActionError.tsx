"use client";
import { toast } from "sonner";

interface serverActionSuccess {
    success: true;
    msg: string;
    link?: {
      href: string;
      label: string;
      target?: string;
    };
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
      if (result.link) {
        toast.info(
          <>
            {result.msg}{" "}
            <a
              href={result.link.href}
              target={result.link.target}
              rel={result.link.target === "_blank" ? "noreferrer noopener" : undefined}
              className="underline text-blue-600"
            >
              {result.link.label}
            </a>
          </>
        );
      } else {
        toast.info(result.msg);
      }
    } else {
      toast.success("Success!");
    }
  } else {
    toast.error(result.error);
  }
}