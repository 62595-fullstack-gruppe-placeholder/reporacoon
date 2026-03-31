import { getScanSettings } from "@/app/ScanSettingsServerActions";
import { ScanSettingsForm } from "./ScanSettingsForm";


export default async function SettingsPage() {
    const settings = await getScanSettings();
    // These should never be used
    const defaultSettings = {extensions: [".py", ".js", ".yml"], isDeep: true}
    return <ScanSettingsForm initialSettings={settings ?? defaultSettings} />;
}