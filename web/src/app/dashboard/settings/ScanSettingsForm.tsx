"use client";

import { useServerAction } from "@lib/hooks/useServerAction";
import { updateScanSettings } from "@/app/ScanSettingsServerActions";
import { IgnoreSettingsButtons } from "@/app/_components/IgnoreSettings";
import { ScanOptions } from "@/app/_components/ScanOptions";
import { useState, useEffect } from "react";
import { extensionsUtil } from "@/lib/utils";
import { SubmitButton } from "@/app/_components/SubmitButton";
import { Settings, settingsSchema } from "@/lib/repository/user/userSchemas";


interface ScanSettingsFormProps {
  initialSettings: Settings;
}

export function ScanSettingsForm({ initialSettings }: ScanSettingsFormProps) {
  const { execute, isPending } = useServerAction(updateScanSettings);
  const [selectedExtensions, setSelectedExtensions] = useState<Set<string>>(
    new Set(initialSettings.extensions)
  );
  const [isDeepScan, setIsDeepScan] = useState(initialSettings.isDeep);

  // Update local state when initialSettings change (from server revalidation)
  useEffect(() => {
    setSelectedExtensions(new Set(initialSettings.extensions));
    setIsDeepScan(initialSettings.isDeep);
  }, [initialSettings]);

  const handleSave = async (formData: FormData) => {
    // Convert Set back to array for server action
    const extensionsArray = Array.from(selectedExtensions);
    formData.set("extensions", extensionsArray.join(","));
    formData.set("isDeep", isDeepScan.toString());


    await execute(formData)
  };

  return (
    <div className="flex flex-col justify-center items-center gap-8 ">
      <form action={handleSave} className="px-4 py-10 flex flex-col justify-center items-center gap-8 min-w-125 max-w-125">
        {/* Extensions selector - unchecked = ignore (scan) */}
        <IgnoreSettingsButtons
          extensions={selectedExtensions}
          onSelectedChange={setSelectedExtensions}
        />

        {/* Deep scan toggle */}
        <ScanOptions
          isDisabled={false}
          isDeep={isDeepScan}
          onDeepChange={setIsDeepScan}
        />

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t border-secondary/10">
          <SubmitButton text="Save Settings" loadingText="Saving..." loading={isPending} />
        </div>
      </form>
    </div>

  );
}