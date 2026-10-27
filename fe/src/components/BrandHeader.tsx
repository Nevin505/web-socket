import { Link } from "react-router-dom";

export const BrandHeader = () => {
  return (
    <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 sm:p-8 z-10">
      <Link to="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
          <svg
            className="h-5 w-5 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6.83L6 14.83V4h12v10z" />
          </svg>
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white leading-tight">Pulse</div>
          <div className="text-[11px] text-slate-400 font-medium">Expressive Messaging</div>
        </div>
      </Link>

      <div className="flex items-center gap-2 rounded-full border border-white/5 bg-slate-900/60 px-3 py-1.5 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-medium text-slate-300">Network Operational</span>
      </div>
    </header>
  );
};

export default BrandHeader;
