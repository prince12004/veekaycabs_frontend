import Link from "next/link";
import { Car } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

export default function NotFound() {
  return (
    <PageLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-24">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF3ED] flex items-center justify-center mb-5">
          <Car size={28} className="text-[#E8540A]" />
        </div>
        <h1 className="text-3xl font-black font-syne text-[#0F0F1A] mb-2">Page not found</h1>
        <p className="text-[#9090A8] text-sm mb-6 max-w-sm">
          We couldn&apos;t find what you&apos;re looking for. The car or page may have moved.
        </p>
        <Link href="/book" className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold text-sm">
          Browse Cars
        </Link>
      </div>
    </PageLayout>
  );
}
