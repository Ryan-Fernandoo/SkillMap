import Sidebar from "../component/sidebar";
import { Suspense } from "react";

export default function MainContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7faff]">
      <Sidebar />

      <main className="min-h-screen lg:ml-64">
        <div className="relative mx-auto min-h-screen w-full max-w-[1500px] px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-sm text-slate-500">
                  Memuat SkillMap...
                </p>
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}