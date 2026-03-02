import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({text, loadingText, loading}: {text: string, loadingText: string, loading: boolean}) {
    return (
        <button
            type="submit"
            disabled={loading}
            className='btn bg-button-main gap-3'>
            {loading ? (
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