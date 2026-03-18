"use client";

import ScanResults from "@/app/_components/ScanResults";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { TryItYourself } from "./TryItYourself";
import { useState } from "react";

export function SharePage({
  job,
  findings,
  children,
}: {
  job: ScanJob;
  findings: ScanFinding[];
  children: React.ReactNode;
}) {
  const [tried, setTried] = useState(false);

  return (
    <div className="w-full">
      <div className="w-3/4 mx-auto my-8">
        {!tried && (
          <>
            {children}

            <ScanResults jobs={[job]} findings={findings} />
          </>
        )}

        <TryItYourself
          postScanCallback={() => {
            setTried(true);
          }}
          tried={tried}
        />
      </div>
    </div>
  );
}
