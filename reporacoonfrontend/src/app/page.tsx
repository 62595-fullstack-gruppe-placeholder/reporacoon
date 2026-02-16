import Image from 'next/image'


export default function Home() {
  return (
    <div className='flex flex-col justify-center items-center gap-8'>
      <div className=' px-4 py-10 inline-flex flex-col justify-start items-start gap-8 min-w-96 max-w-125'>
        <h1 className="h1">Sniff out
          vulnerabilities in
          seconds</h1>
        <p className="p">Repo Raccoon scrapes public repositories to provide
          comprehensive security overviews, helping you identify and
          address potential weaknesses. </p>

        <div className="field">
          <Image src="/searchIcon.svg" alt="" width={20} height={20}></Image>
        
          <form className='flex items-center flex-1 w-full gap-8'>
            <input className='fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate' placeholder="Paste a GitHub/GitLab URL"/>
            <button type="submit" className='btn bg-button-main'> Start Scanning </button>
          </form>
        </div>
      </div>

      <div className='inline-flex justify-start items-start gap-40'>
        <div className="box w-80 h-72">
          <h1 className='h1 border-b border-secondary flex justify-center items-center gap-2.5 p-2.5'>Why?</h1>
          <p className='p self-stretch px-4 pt-2'>
            Have you ever lost 1000’s of dollars because a junior
            developer pushed an API key? Our goal is to prevent scenarios like this,
            with security overviews and weekly reviews.</p>
        </div>

        <div className="box w-80 h-72">
          <h1 className='h1 border-b border-secondary flex justify-center items-center gap-2.5 p-2.5'>How?</h1>
          <p className='p self-stretch px-4 pt-2'>
            Using a proprietary indexing technology,
            Repo Racoon searches your repository for any
            vulnerabilites, like API keys or other secrets.</p>
        </div>
      </div>
    </div>
  );
}
