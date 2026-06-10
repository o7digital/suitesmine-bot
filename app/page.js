import O7Widget from "@/components/O7Widget";

export default function Page({ searchParams }) {
  const embedded = searchParams?.embed === "1";

  return (
    <main className={embedded ? "min-h-screen bg-white" : "min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff,white_35%,#e9eefb_100%)]"}>
      <O7Widget clientId="suitesmine" title="Olivia AI" embedded={embedded} />
    </main>
  );
}
