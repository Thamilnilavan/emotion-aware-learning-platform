import { BrandLogo } from '@/components/common/BrandLogo';

export default function Loading() {
  return (
    <div className="universe-shell fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div className="liquid-glass flex w-full max-w-sm flex-col items-center rounded-[2rem] px-8 py-10 text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="cosmic-orbit absolute inset-0 rounded-full border border-[#F1FEC8]/20 border-t-[#F1FEC8]" />
          <div className="cosmic-orbit absolute inset-3 rounded-full border border-[#23212C]/10 border-b-[#23212C] [animation-direction:reverse] [animation-duration:1.7s]" />
          <div className="cosmic-breathe flex h-14 w-14 items-center justify-center rounded-2xl bg-[#23212C]/70 shadow-[0_10px_30px_rgba(35,33,44,.25)]">
            <BrandLogo showName={false} priority imageClassName="h-14 w-14" />
          </div>
          <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-[#F1FEC8] shadow-[0_0_12px_#F1FEC8]" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">Eduvo</p>
        <h2 className="mt-2 text-xl font-extrabold text-heading">Preparing your learning space</h2>
        <p className="mt-2 text-sm leading-6 text-body">Loading your courses, progress and AI insights…</p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-[#23212C]/10">
          <div className="cosmic-breathe h-full w-2/3 rounded-full bg-[#23212C]" />
        </div>
      </div>
    </div>
  );
}
