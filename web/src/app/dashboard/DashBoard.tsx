"use client";

import { getUser } from "@/lib/auth/userFromToken";
import Image from 'next/image';

import URLForm from "../_components/URLForm";
import { ScanOptions } from "../_components/ScanOptions";
import { useState } from "react";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import ScanResults from "../_components/ScanResults";
import { IgnoreSettingsButtons } from "../_components/IgnoreSettings";
import { Settings } from "@/lib/repository/user/userSchemas";

export default function Dashboard({ user, settings }: { user: any, settings: Settings }) {
    const [scanFindings, setScanFindings] = useState<ScanFinding[] | null>(null);
    const [scanJobs, setScanJob] = useState<ScanJob[] | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const extensions = new Set<string>(settings.extensions);
    const [isDeepScan, setIsDeepScan] = useState(settings.isDeep);
    const [selected, setSelected] = useState(extensions);
    
    const handleScanSuccess = (findings: ScanFinding[], jobs: ScanJob[]) => {
        setScanFindings(findings);
        setIsScanning(true);
        setScanJob(jobs);
    };
    return (
        <div className="flex flex-col justify-center items-center gap-8">
            <div className="px-4 py-10 flex flex-col justify-center items-center gap-8 min-w-96 max-w-125">
                This is a secret page that requires authentication.
                <p>{JSON.stringify(user)}</p>

                <div className="field flex items-center gap-2">
                    <Image src="/searchIcon.svg" alt="" width={20} height={20} />

                    <URLForm onScanStarted={handleScanSuccess} isDeepScan={isDeepScan} extensions={selected} />
                </div>
                <ScanOptions isDisabled={false} isDeep={settings.isDeep} onDeepChange={(isDeep) => setIsDeepScan(isDeep)} />
                <IgnoreSettingsButtons onSelectedChange={(selected) => setSelected(selected)} extensions={selected}/>
                    

                {/* Dashboard appears with fade and slide down animation */}
                <div
                    className={`
                w-full max-w-6xl px-4
                transition-all duration-700 ease-out
                ${isScanning
                            ? 'opacity-100 translate-y-0 max-h-[1000px]'
                            : 'opacity-0 -translate-y-10 max-h-0 overflow-hidden'
                        }
              `}
                >
                </div>
            </div>
            <div
                className={`
                      w-full max-w-6xl px-4
                      transition-all duration-700 ease-out
                      ${isScanning
                        ? 'opacity-100 translate-y-0 max-h-[1000px]'
                        : 'opacity-0 -translate-y-10 max-h-0 overflow-hidden'
                    }
                    `}
            >
                <ScanResults findings={scanFindings} jobs={scanJobs} />
            </div>
        </div>
    );
}
