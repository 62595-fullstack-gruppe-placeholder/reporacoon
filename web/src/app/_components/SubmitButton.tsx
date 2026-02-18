import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({text, loadingText}: {text: string, loadingText: string}) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className='btn bg-button-main gap-3'>
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingText}</span>
                </>
            ) : (
                <span>{text}</span>
            )}
        </button>
    )
}