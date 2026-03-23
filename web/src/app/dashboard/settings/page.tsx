import { getScanSettings } from "@/app/ScanSettingsServerActions";
import { ScanSettingsForm } from "./ScanSettingsForm";


export default async function SettingsPage() {
    const settings = await getScanSettings();
    const defaultSettings = {extensions: [".py", ".js", ".yml"], isDeep: false}
    return <ScanSettingsForm initialSettings={settings ?? defaultSettings} />;
}