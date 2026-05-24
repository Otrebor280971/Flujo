import type { ElementType } from 'react';

interface Tab<T extends string> {
  id: T;
  label: string;
  icon: ElementType;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}

export default function BottomNav<T extends string>({
  tabs,
  activeTab,
  onChange,
}: Props<T>) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.04] bg-app-bg/90 backdrop-blur-xl">
      <div className="max-w-lg mx-auto flex pb-[max(env(safe-area-inset-bottom),0.4rem)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex-1
                flex
                flex-col
                items-center
                justify-center
                gap-1
                py-2.5
                transition-colors
                ${active
                  ? 'text-cyan-300'
                  : 'text-zinc-500'}
              `}
            >
              <Icon
                size={19}
                className={active ? 'opacity-100' : 'opacity-75'}
              />

              <span className="text-[10px] font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}