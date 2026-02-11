export default function Home() {
  return (
    <div className="w-[1440px] h-[1024px] min-h-[800px] bg-neutral-900 inline-flex flex-col justify-center items-start overflow-hidden">
    <div className="w-[1440px] h-[1024px] flex flex-col justify-start items-start">
        <div className="self-stretch px-10 py-3 border-b border-zinc-800 inline-flex justify-between items-center">
            <div className="flex justify-start items-center gap-4">
                <img className="w-8 h-8" src="https://placehold.co/32x32" />
                <div className="w-4 h-4" />
                <div className="inline-flex flex-col justify-start items-start">
                    <div className="w-32 justify-center text-white text-lg font-bold font-['Inter'] leading-6">Repo Racoon</div>
                </div>
            </div>
            <div className="flex-1 h-10 flex justify-end items-start gap-8">
                <div className="w-14 self-stretch" />
                <div className="self-stretch inline-flex flex-col justify-start items-start">
                    <div className="self-stretch inline-flex flex-col justify-start items-start">
                        <div className="w-14 h-11 justify-center text-white text-sm font-medium font-['Inter'] leading-5">Features</div>
                    </div>
                    <div className="h-10 max-w-[480px] min-w-20 px-4 bg-green-700 rounded-lg inline-flex justify-center items-center overflow-hidden">
                        <div className="inline-flex flex-col justify-start items-center overflow-hidden">
                            <div className="w-14 h-5 text-center justify-center text-white text-sm font-bold font-['Inter'] leading-5 tracking-tight">Sign Up</div>
                        </div>
                    </div>
                    <div className="h-10 max-w-[480px] min-w-20 px-5 bg-zinc-800 rounded-lg inline-flex justify-center items-center overflow-hidden">
                        <div className="inline-flex flex-col justify-start items-center overflow-hidden">
                            <div className="w-11 h-5 text-center justify-center text-white text-sm font-bold font-['Inter'] leading-5 tracking-tight">Log In</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="self-stretch h-[513px] px-40 py-5 inline-flex justify-center items-start">
            <div className="flex-1 self-stretch max-w-[960px] relative">
                <div className="w-[960px] h-96 px-4 py-10 left-0 top-0 absolute inline-flex justify-center items-center gap-8">
                    <div className="flex-1 h-96 min-w-96 inline-flex flex-col justify-start items-center gap-8">
                        <div className="w-[928px] flex flex-col justify-start items-center gap-2">
                            <div className="self-stretch flex flex-col justify-start items-center">
                                <div className="w-[452px] justify-center text-white text-5xl font-black font-['Inter'] leading-[60px]">Sniff out<br/>vulnerabilities in<br/>seconds</div>
                            </div>
                            <div className="flex flex-col justify-start items-start">
                                <div className="self-stretch justify-center text-white text-base font-normal font-['Inter'] leading-6">Repo Raccoon scrapes public repositories to provide<br/>comprehensive security overviews, helping you identify and<br/>address potential weaknesses.</div>
                            </div>
                        </div>
                        <div className="w-[480px] h-16 max-w-[480px] min-w-40 flex flex-col justify-center items-start">
                            <div className="self-stretch flex-1 rounded-lg inline-flex justify-start items-start">
                                <div className="self-stretch pl-4 bg-zinc-800 rounded-tl-lg rounded-bl-lg flex justify-center items-center">
                                    <div className="w-5 h-5 relative overflow-hidden">
                                        <div className="w-4 h-4 left-[1.86px] top-[1.86px] absolute bg-neutral-400" />
                                    </div>
                                </div>
                                <div className="flex-1 self-stretch relative bg-zinc-800 overflow-hidden">
                                    <div className="left-[8px] top-[23px] absolute justify-center text-neutral-400 text-base font-normal font-['Inter']">Paste a GitHub/GitLab URL</div>
                                </div>
                                <div className="self-stretch pr-2 bg-zinc-800 rounded-tr-lg rounded-br-lg flex justify-center items-center">
                                    <div className="h-12 max-w-[480px] min-w-20 px-5 bg-green-700 rounded-lg flex justify-center items-center overflow-hidden">
                                        <div className="inline-flex flex-col justify-start items-center overflow-hidden">
                                            <div className="w-28 h-6 text-center justify-center text-white text-base font-bold font-['Inter'] leading-6 tracking-tight">Start Scanning</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="self-stretch px-72 py-2.5 inline-flex justify-start items-start gap-40 overflow-hidden">
            <div className="w-80 h-72 relative">
                <div className="w-80 h-72 left-0 top-0 absolute bg-zinc-800 rounded-2xl" />
                <div className="w-80 h-16 p-2.5 left-0 top-0 absolute border-b border-zinc-500 inline-flex justify-center items-center gap-2.5">
                    <div className="justify-center text-white text-5xl font-black font-['Inter'] leading-[60px]">Why?</div>
                </div>
                <div className="w-80 h-56 px-4 pt-2 left-0 top-[70px] absolute inline-flex flex-col justify-start items-start">
                    <div className="self-stretch justify-center text-white text-base font-normal font-['Inter'] leading-6">Have you ever lost 1000’s of dollars because a junior developer pushed an API key? Our goal is to prevent scenarios like this, with security overviews and weekly reviews.</div>
                </div>
            </div>
            <div className="w-80 h-72 relative">
                <div className="w-80 h-72 left-0 top-0 absolute bg-zinc-800 rounded-2xl" />
                <div className="w-80 h-56 px-4 pt-2 left-0 top-[70px] absolute inline-flex flex-col justify-start items-start">
                    <div className="self-stretch justify-center text-white text-base font-normal font-['Inter'] leading-6">Using a proprietary indexing technology, Repo Racoon searches your repository for any vulnerabilites, like API keys or other secrets.</div>
                </div>
                <div className="w-80 h-16 p-2.5 left-0 top-0 absolute border-b border-zinc-500 inline-flex justify-center items-center gap-2.5">
                    <div className="justify-center text-white text-5xl font-black font-['Inter'] leading-[60px]">How?</div>
                </div>
            </div>
        </div>
    </div>
</div>
  );
}
