import Link from "next/link";

// automatically rendered by Next.js if a GET request is made to a non-existent endpoint
export default function NotFoundPage() {
  return (
    <div className="flex flex-col justify-center items-center my-24">
      <div className="px-4 py-10 inline-flex flex-col justify-start items-start gap-4">
        <div>
          <h1 className="h1">There's nothing here...</h1>

          <p className="p">We couldn't find the page you're looking for.</p>
        </div>

        <Link href="/" className="bg-button-main btn">
          Return to the front page
        </Link>
      </div>
    </div>
  );
}
