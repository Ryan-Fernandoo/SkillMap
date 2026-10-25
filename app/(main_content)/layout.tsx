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

      <main className="skillmap-main-shell ml-64 min-h-screen">
        <div className="skillmap-page relative mx-auto min-h-screen w-full max-w-[1500px] px-8 py-8 xl:px-10">
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