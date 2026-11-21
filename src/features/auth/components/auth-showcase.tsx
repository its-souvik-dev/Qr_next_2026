import { QR_PRESETS, renderQrSvg } from "@/lib/qr";

/** Decorative right-hand panel for auth pages — rendered entirely on the server. */
export function AuthShowcase() {
  const samples = [QR_PRESETS[3]!, QR_PRESETS[1]!, QR_PRESETS[7]!].map((p, i) =>
    renderQrSvg(`https://maxqr.app/s/demo${i}`, { ...p.config, logo: null }, { responsive: true }).svg,
  );
  return (
    <div className="relative hidden overflow-hidden border-l bg-muted/40 lg:block">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="relative flex h-full flex-col items-center justify-center gap-10 p-12">
        <div className="relative h-72 w-80">
          {samples.map((svg, i) => (
            <div
              key={i}
              className="absolute size-44 rounded-2xl border bg-white p-3 shadow-xl shadow-black/5"
              style={{ left: `${i * 68}px`, top: `${[40, 0, 70][i]}px`, rotate: `${[-8, 3, 10][i]}deg`, zIndex: i === 1 ? 2 : 1 }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ))}
        </div>
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold tracking-tight">Static QR codes that never expire</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your content is encoded straight into the code — no redirects, no subscriptions. Add short links and analytics when you need them.
          </p>
        </div>
      </div>
    </div>
  );
}
