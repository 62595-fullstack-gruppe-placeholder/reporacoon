'use client';

import { useState } from 'react';
import Image from 'next/image';
import URLForm from './_components/URLForm';
import ScanResults from './_components/ScanResults';
import { ScanFinding } from '@/lib/repository/scanFinding/scanFindingSchema';
import { ScanJob } from '@/lib/repository/scanJob/scanJobSchemas';

export default function Home() {
  const [scanFindings, setScanFindings] = useState<ScanFinding[] | null>(null);
  const [scanJob, setScanJob] = useState<ScanJob | null>(null);

  const handleScanSuccess = (findings: ScanFinding[], job: ScanJob) => {
    setScanFindings(findings);
    setScanJob(job);
  };


  return (
    <div className="flex flex-col justify-center items-center gap-8">
      <div className="px-4 py-10 inline-flex flex-col justify-start items-start gap-8 min-w-96 max-w-125">
        <h1 className="h1">
          Sniff out vulnerabilities in seconds
        </h1>

        <p className="p">
          Repo Raccoon scrapes public repositories to provide
          comprehensive security overviews, helping you identify and
          address potential weaknesses.
        </p>

        <div className="field flex items-center gap-2">
          <Image src="/searchIcon.svg" alt="" width={20} height={20} />

          <URLForm onScanStarted={handleScanSuccess} />
        </div>
      </div>


      <div className="box w-80 h-72">
        <h1 className="h1 border-b border-secondary flex justify-center items-center gap-2.5 p-2.5">
          Why?
        </h1>
        <p className="p self-stretch px-4 pt-2">
          Have you ever lost 1000's of dollars because a junior
          developer pushed an API key? Our goal is to prevent scenarios like this,
          with security overviews and weekly reviews.
        </p>
      </div>

      <div className="box w-80 h-72">
        <h1 className="h1 border-b border-secondary flex justify-center items-center gap-2.5 p-2.5">
          How?
        </h1>
        <p className="p self-stretch px-4 pt-2">
          Using a proprietary indexing technology,
          Repo Raccoon searches your repository for any
          vulnerabilites, like API keys or other secrets.
        </p>
      </div>
    </div>
  );
}