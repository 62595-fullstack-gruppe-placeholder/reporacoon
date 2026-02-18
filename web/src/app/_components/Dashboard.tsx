'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // fake loading scan, just for frontend demo purposes
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setDone(true);
          return 100;
        }
        return p + 3;
      });
    }, 80);

    return () => clearInterval(timer);
  }, []);

  const stats = {
    critical: 2,
    high: 3,
    medium: 5,
    low: 4,
    files: 231,
  };

  const findings = [
    {
      type: 'AWS API Key',
      severity: 'critical',
      location: 'config.js:15',
      desc: 'Hardcoded production key',
    },
    {
      type: 'Database Password',
      severity: 'high',
      location: 'db.ts:42',
      desc: 'Plaintext password in repo',
    },
    {
      type: 'JWT Secret',
      severity: 'medium',
      location: 'auth.ts:21',
      desc: 'Token secret exposed',
    },
  ];

  if (!done) {
    return (
      <div className="box p-8">
        <h2 className="h1 mb-4">Scanning Repository</h2>

        <div className="w-full h-4 bg-secondary/20 rounded-full">
          <div
            className="h-full bg-button-main transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="p mt-3">{progress}% analyzed</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1 text-3xl">Scan Results</h1>
        <p className="p text-secondary">
          github.com/company/project
        </p>
      </div>


      <div className="grid grid-cols-4 gap-4">
        <Stat label="Critical" value={stats.critical} />
        <Stat label="High" value={stats.high} />
        <Stat label="Medium" value={stats.medium} />
        <Stat label="Low" value={stats.low} />
      </div>

      <div className="box p-4">
        <p className="text-secondary">Files scanned</p>
        <p className="h1 text-2xl">{stats.files}</p>
      </div>

      <div className="box p-6">
        <h2 className="h1 mb-4">Findings</h2>

        <div className="space-y-3">
          {findings.map((f, i) => (
            <div key={i} className="border-l-4 border-red-500 p-3 bg-box/50">
              <div className="flex justify-between">
                <p className="font-semibold">{f.type}</p>
                <span className="text-sm capitalize">{f.severity}</span>
              </div>
              <p className="text-sm text-secondary">{f.desc}</p>
              <p className="text-xs text-secondary">
                {f.location}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="box p-4">
      <p className="text-secondary text-sm">{label}</p>
      <p className="h1 text-2xl">{value}</p>
    </div>
  );
}