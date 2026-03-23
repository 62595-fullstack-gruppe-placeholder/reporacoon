import { IgnoreSettingsButtons } from "@/app/_components/IgnoreSettings";
import { extensionsUtil } from "@/lib/utils";
import { useState } from "react";


export default async function Settings() {
  const extensions = extensionsUtil;
  const [selected, setSelected] = useState(extensions);

  return (
    <div className="flex flex-col justify-center items-center gap-8">
      <div className="px-4 py-10 flex flex-col justify-center items-center gap-8 min-w-96 max-w-125">
        The settings below will apply as default settings to every scan you make while logged in, but if you make any changes to the settings
        on an per scan basis, those settings will apply for that scan. 

        <IgnoreSettingsButtons onSelectedChange={(selected) => setSelected(selected)} extensions={extensions}/>
      </div>
    </div>
  );
}