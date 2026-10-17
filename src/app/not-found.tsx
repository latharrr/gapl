import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusScreen, ghostOnDark } from "@/components/brand/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      led="404 · NO SUCH STOP"
      title="This page isn't on the route."
      body="The link may be old or mistyped. Head back to the start, or check your status."
      actions={
        <>
          <Link href="/analyze">
            <Button size="lg" className="w-full sm:w-auto">
              Check my status <ArrowRight size={17} strokeWidth={2.5} />
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
