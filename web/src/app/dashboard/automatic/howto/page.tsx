import {
  CheckCircle2,
  Copy,
  ExternalLink,
  GitBranch,
  Github,
  Shield,
  Webhook,
} from "lucide-react";

const GITHUB_WEBHOOK_URL = "http://130.225.170.68/api/push-webhook";
const REPO_REGISTRATION_URL = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automatic`;

export default function GithubWebhookSetupPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md border border-secondary/20 bg-text-main/5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-secondary">
              <Github size={14} />
              GitHub webhook setup
            </div>

            <div className="space-y-3">
              <h1 className="font-mono text-2xl text-text-main">
                Set up automatic scans from GitHub push events
              </h1>
              <p className="max-w-3xl text-sm font-mono text-secondary">
                Connect a public GitHub repository to automatic scanning by
                adding a webhook in GitHub, then registering the repository in
                our system.
              </p>
            </div>

            <div className="rounded-md border border-yellow-700/20 bg-yellow-700/10 p-4">
              <div className="flex items-start gap-3">
                <GitBranch className="mt-0.5 text-yellow-700" size={16} />
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-widest text-yellow-700">
                    Public repositories only for now
                  </p>
                  <p className="text-sm font-mono text-text-main">
                    Automatic scanning currently works for public repositories
                    only. Private repository support is coming soon.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
                Webhook URL
              </label>
              <p className="text-sm font-mono text-secondary">
                Use this exact URL as the GitHub webhook payload URL. Replace
                the placeholder value with your real endpoint later.
              </p>
            </div>

            <div className="rounded-md border border-secondary/20 bg-background/30 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <code className="block min-w-0 break-all text-sm font-mono text-text-main">
                  {GITHUB_WEBHOOK_URL}
                </code>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main"
                >
                  <Copy size={14} />
                  Copy URL
                </button>
              </div>
            </div>

            <p className="text-xs font-mono text-secondary">
              In GitHub, this goes in the{" "}
              <span className="text-text-main">Payload URL</span> field.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-4">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
                Required GitHub settings
              </label>

              <div className="space-y-3 text-sm font-mono text-text-main">
                <div className="rounded-md border border-secondary/20 bg-background/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">
                    Event trigger
                  </p>
                  <p>Just the push event</p>
                </div>

                <div className="rounded-md border border-secondary/20 bg-background/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">
                    Content type
                  </p>
                  <p>application/json</p>
                </div>

                <div className="rounded-md border border-secondary/20 bg-background/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">
                    Secret
                  </p>
                  <p>Optional, but recommended</p>
                </div>

                <div className="rounded-md border border-secondary/20 bg-background/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">
                    Status
                  </p>
                  <p>Active</p>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-4">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
                Important note about secrets
              </label>

              <div className="flex items-start gap-3 rounded-md border border-secondary/20 bg-background/30 p-3">
                <Shield className="mt-0.5 text-secondary" size={16} />
                <div className="space-y-2 text-sm font-mono text-secondary">
                  <p>
                    If you set a webhook secret in GitHub, write it down and
                    keep it safe.
                  </p>
                  <p>
                    You will need to enter the exact same secret in our
                    repository registration form so we can validate incoming
                    webhook deliveries.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
                Step 1
              </label>
              <h2 className="font-mono text-lg text-text-main">
                Add the webhook in GitHub
              </h2>
              <p className="text-sm font-mono text-secondary">
                In the repository you want to scan, go to Settings, then
                Webhooks, then Add webhook.
              </p>
            </div>

            <div className="space-y-3 text-sm font-mono text-text-main">
              <div className="rounded-md border border-secondary/20 bg-background/30 p-4">
                <ol className="space-y-3">
                  <li>1. Open the GitHub repository.</li>
                  <li>
                    2. Go to <span className="text-secondary">Settings</span>.
                  </li>
                  <li>
                    3. Open <span className="text-secondary">Webhooks</span>.
                  </li>
                  <li>
                    4. Click <span className="text-secondary">Add webhook</span>
                    .
                  </li>
                  <li>
                    5. Paste{" "}
                    <span className="text-secondary">
                      the webhook URL above
                    </span>{" "}
                    into Payload URL.
                  </li>
                  <li>
                    6. Set Content type to{" "}
                    <span className="text-secondary">application/json</span>.
                  </li>
                  <li>
                    7. Optionally add a secret, then save that secret somewhere
                    safe.
                  </li>
                  <li>
                    8. Choose{" "}
                    <span className="text-secondary">
                      Let me select individual events
                    </span>
                    .
                  </li>
                  <li>
                    9. Select only <span className="text-secondary">Push</span>.
                  </li>
                  <li>
                    10. Make sure the webhook is active, then click{" "}
                    <span className="text-secondary">Add webhook</span>.
                  </li>
                </ol>
              </div>

              <div className="rounded-md border border-secondary/20 bg-background/30 p-3">
                <div className="flex items-start gap-3">
                  <Webhook className="mt-0.5 text-secondary" size={16} />
                  <p className="text-sm font-mono text-secondary">
                    GitHub sends a simple{" "}
                    <span className="text-text-main">ping</span> event when the
                    webhook is created so you can confirm the endpoint is
                    reachable. Automatic scans should be triggered by later{" "}
                    <span className="text-text-main">push</span> events.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
                Step 2
              </label>
              <h2 className="font-mono text-lg text-text-main">
                Register the repository in our system
              </h2>
              <p className="text-sm font-mono text-secondary">
                Once the GitHub webhook exists, return to our app and register
                the same repository.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-secondary/20 bg-background/30 p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  Repository URL
                </p>
                <p className="text-sm font-mono text-text-main">
                  Paste the public GitHub repository URL into the registration
                  form.
                </p>
              </div>

              <div className="rounded-md border border-secondary/20 bg-background/30 p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  Scan mode
                </p>
                <p className="text-sm font-mono text-text-main">
                  Choose whether to scan the default branch or all branches.
                </p>
              </div>

              <div className="rounded-md border border-secondary/20 bg-background/30 p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  Secret
                </p>
                <p className="text-sm font-mono text-text-main">
                  If you set a GitHub webhook secret, paste the same secret into
                  our form. If you did not set one, leave it blank.
                </p>
              </div>

              <div className="rounded-md border border-secondary/20 bg-background/30 p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  Finish
                </p>
                <p className="text-sm font-mono text-text-main">
                  Submit the form and the repository will be ready for automatic
                  scans.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
                Step 3
              </label>
              <h2 className="font-mono text-lg text-text-main">
                Test it with a commit
              </h2>
            </div>

            <div className="rounded-md border border-secondary/20 bg-background/30 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-button-main" size={16} />
                <p className="text-sm font-mono text-secondary">
                  After setup is complete, push a new commit to the repository
                  to test the integration and confirm that an automatic scan
                  runs.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-secondary/20 bg-text-main/5 p-4 md:p-5 space-y-4">
            <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
              GitHub reference
            </label>

            <div className="flex flex-col gap-3 md:flex-row">
              <a
                href={REPO_REGISTRATION_URL}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main"
              >
                Register repository
                <ExternalLink className="ml-2" size={14} />
              </a>
              <a
                href="https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main"
              >
                <ExternalLink size={14} />
                Creating webhooks
              </a>

              <a
                href="https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main"
              >
                <ExternalLink size={14} />
                Validating deliveries
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
