interface Props {
  title: string;
  subtitle?: string;
}

export default function ScreenHeader({
  title,
  subtitle,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-app-bg/80 backdrop-blur-xl">
      <div className="max-w-lg mx-auto px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.15rem] font-semibold tracking-tight text-zinc-100">
              {title}
            </h1>

            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}