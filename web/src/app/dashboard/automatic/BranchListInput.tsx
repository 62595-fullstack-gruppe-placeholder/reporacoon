"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function BranchListInput({
  value,
  onChange,
  disabled = false,
  error,
  label = "Branches to scan",
  helperText = "Type a branch name and press Enter or click add",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
}) {
  const [draft, setDraft] = useState("");

  const addBranch = () => {
    const normalized = draft.trim();

    if (!normalized) return;
    if (value.includes(normalized)) {
      setDraft("");
      return;
    }

    onChange([...value, normalized]);
    setDraft("");
  };

  const removeBranch = (branchToRemove: string) => {
    onChange(value.filter((branch) => branch !== branchToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
        {label}
      </label>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addBranch();
            }
          }}
          placeholder="main, develop, feature/login-flow"
          disabled={disabled}
          className={`field flex-1 px-3 py-2 font-mono text-sm border rounded-md outline-none transition-all ${
            error
              ? "border-destructive bg-destructive/5"
              : "border-secondary/20 bg-text-main/5 focus:ring-2 focus:ring-button-main/30 focus:border-button-main/40"
          }`}
        />

        <button
          type="button"
          onClick={addBranch}
          disabled={disabled || !draft.trim()}
          className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main disabled:opacity-50"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <p className="uppercase text-[10px] font-mono text-secondary tracking-widest block">
        {helperText}
      </p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((branch) => (
            <span
              key={branch}
              className="inline-flex items-center gap-2 rounded-md border border-secondary/20 bg-text-main/5 px-2 py-1 text-xs font-mono text-text-main"
            >
              {branch}
              <button
                type="button"
                onClick={() => removeBranch(branch)}
                disabled={disabled}
                aria-label={`Remove branch ${branch}`}
                className="text-secondary hover:text-text-main disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-destructive text-xs mt-1 font-mono">{error}</p>
      )}
    </div>
  );
}
