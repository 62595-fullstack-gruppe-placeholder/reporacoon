"use client";

import { getUser } from "@/lib/auth/userFromToken";
import Image from 'next/image';

import URLForm from "../_components/URLForm";
import { ScanOptions } from "../_components/ScanOptions";
import { useState } from "react";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import ScanResults from "../_components/ScanResults";

export default function Dashboard({ user }: { user: any }) {
    const [scanFindings, setScanFindings] = useState<ScanFinding[] | null>(null);
    const [scanJob, setScanJob] = useState<ScanJob | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isDeepScan, setIsDeepScan] = useState(false);

    const handleScanSuccess = (findings: ScanFinding[], job: ScanJob) => {
        setScanFindings(findings);
        setIsScanning(true);
        setScanJob(job);
    };
    return (
        <div className="flex flex-col justify-center items-center gap-8">
            <div className="px-4 py-10 inline-flex flex-col justify-start items-start gap-8 min-w-96 max-w-125">
                This is a secret page that requires authentication.
                <p>{JSON.stringify(user)}</p>

                <div className="field flex items-center gap-2">
                    <Image src="/searchIcon.svg" alt="" width={20} height={20} />

                    <URLForm onScanStarted={handleScanSuccess} isDeepScan={isDeepScan} />
                </div>
                <ScanOptions isDisabled={false} onDeepChange={(isDeep) => setIsDeepScan(isDeep)} />

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
                <ScanResults findings={scanFindings} job={scanJob} />
            </div>
        </div>
    );
}
