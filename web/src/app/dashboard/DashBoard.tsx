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

export default function Dashboard({ user }: { user: any }) {
    const [scanFindings, setScanFindings] = useState<ScanFinding[] | null>(null);
    const [scanJobs, setScanJob] = useState<ScanJob[] | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isDeepScan, setIsDeepScan] = useState(false);
    const [selected, setSelected] = useState(new Set<string>());

      // All of the file extensions that the scanner will search
  const extensions = new Set<string>(['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb', '.php',
        '.html', '.htm', '.xml', '.json', '.yml', '.yaml', '.toml', '.ini',
        '.cfg', '.conf', '.config', '.env', '.sh', '.bash', '.zsh', '.fish',
        '.ps1', '.bat', '.cmd', '.txt', '.rst', '.tex', '.csv',
        '.sql', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
        '.swift', '.kt', '.kts', '.rs', '.scala', '.clj', '.elm',
        '.ex', '.exs', '.erl', '.hrl', '.hs', '.lhs', '.lua', '.pl',
        '.pm', '.r', '.R', '.dart', '.fs', '.fsx', '.fsi', '.fsscript',
        '.dockerfile', 'Dockerfile', '.gitignore', '.gitattributes',
        '.npmrc', '.yarnrc', '.piprc', '.pypirc', '.gemrc', '.bowerrc',
        '.eslintrc', '.prettierrc', '.babelrc', '.editorconfig',
        'Makefile', 'CMakeLists.txt', 'build.gradle', 'pom.xml',
        'package.json', 'package-lock.json', 'yarn.lock', 'Gemfile',
        'Podfile', 'Cargo.toml', 'go.mod', 'requirements.txt',
        'Pipfile', 'Pipfile.lock', 'environment.yml', 'setup.py'])


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
                <ScanOptions isDisabled={false} onDeepChange={(isDeep) => setIsDeepScan(isDeep)} />
                <IgnoreSettingsButtons onSelectedChange={(selected) => setSelected(selected)} extensions={extensions}/>
                    

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
