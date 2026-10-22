import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusScreen, ghostOnDark } from "@/components/brand/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      mark="404 · Not found"
      title="Nothing on this page."
      body="The link may be old or mistyped. Head back to the start, or get your resume read."
      actions={
        <>
          <Link href="/analyze">
            <Button size="lg" className="w-full sm:w-auto">
              Read my resume <ArrowRight size={17} strokeWidth={2.5} />
            </Button>
          </Link>
          <Link href="/" className={ghostOnDark}>
            Back to home
          </Link>
        </>
      }
    />
  );
}
