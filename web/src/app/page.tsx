'use client';

import { useState } from 'react';
import Image from 'next/image';
import URLForm from './_components/URLForm';
import FakeDashboard from './_components/Dashboard';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);

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

          {/* Fake scan button */}
          <button
            onClick={() => setIsScanning(true)}
            className="btn bg-button-main whitespace-nowrap"
          >
            Mock Scan
          </button>

          <URLForm />
        </div>
      </div>

      {/* Dashboard appears with fade and slide down animation */}
      <div
        className={`
          w-full max-w-6xl px-4
          transition-all duration-700 ease-out
          ${
            isScanning 
              ? 'opacity-100 translate-y-0 max-h-[1000px]' 
              : 'opacity-0 -translate-y-10 max-h-0 overflow-hidden'
          }
        `}
      >
        <FakeDashboard />
      </div>

      {/* Boxes container - slides down and zooms when dashboard appears */}
      <div
        className={`
          inline-flex justify-start items-start gap-40
          transition-all duration-700 ease-out
          origin-top
          ${
            isScanning 
              ? 'scale-90 opacity-70 translate-y-8' 
              : 'scale-100 opacity-100 translate-y-0'
          }
        `}
      >
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
    </div>
  );
}