import { PublicLayout } from "@/components/layout/public-layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="auroral-mesh min-h-[80vh] flex items-center justify-center pt-16">
        {children}
      </div>
    </PublicLayout>
  );
}
