import { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Landmark,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, setStoredLanguage, type SupportedLanguage } from '../lib/index';

const STORAGE_KEY = 'flujo_tutorial_done';

export function useTutorial() {
  const [show, setShow] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        setShow(true);
        setIsFirstTime(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
    setIsFirstTime(false);
  };

  const reopen = () => {
    setIsFirstTime(false);
    setShow(true);
  };

  return { show, dismiss, reopen, isFirstTime };
}

interface Step {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  titleKey: string;
  bodyKey: string;
  tipKey?: string;
}

const STEPS: Step[] = [
  {
    icon: Wallet,
    iconColor: 'text-cyan-300',
    iconBg: 'bg-cyan-400/10',
    titleKey: 'tutorial.step1_title',
    bodyKey: 'tutorial.step1_body',
    tipKey: 'tutorial.step1_tip',
  },
  {
    icon: Landmark,
    iconColor: 'text-emerald-300',
    iconBg: 'bg-emerald-500/10',
    titleKey: 'tutorial.step2_title',
    bodyKey: 'tutorial.step2_body',
    tipKey: 'tutorial.step2_tip',
  },
  {
    icon: CreditCard,
    iconColor: 'text-red-300',
    iconBg: 'bg-red-500/10',
    titleKey: 'tutorial.step3_title',
    bodyKey: 'tutorial.step3_body',
    tipKey: 'tutorial.step3_tip',
  },
  {
    icon: ArrowRightLeft,
    iconColor: 'text-amber-300',
    iconBg: 'bg-amber-500/10',
    titleKey: 'tutorial.step4_title',
    bodyKey: 'tutorial.step4_body',
    tipKey: 'tutorial.step4_tip',
  },
  {
    icon: SlidersHorizontal,
    iconColor: 'text-violet-300',
    iconBg: 'bg-violet-500/10',
    titleKey: 'tutorial.step5_title',
    bodyKey: 'tutorial.step5_body',
    tipKey: 'tutorial.step5_tip',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-blue-300',
    iconBg: 'bg-blue-500/10',
    titleKey: 'tutorial.step6_title',
    bodyKey: 'tutorial.step6_body',
    tipKey: 'tutorial.step6_tip',
  },
  {
    icon: CheckCircle2,
    iconColor: 'text-emerald-300',
    iconBg: 'bg-emerald-500/10',
    titleKey: 'tutorial.step7_title',
    bodyKey: 'tutorial.step7_body',
    tipKey: 'tutorial.step7_tip',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

export default function Tutorial({ open, onClose, isFirstTime = false }: Props) {
  const { t, i18n } = useTranslation();

  // -1 = pantalla de selección de idioma (solo primera vez)
  // 0..n = pasos del tutorial
  const [step, setStep] = useState<number>(isFirstTime ? -1 : 0);

  useEffect(() => {
    if (open) {
      setStep(isFirstTime ? -1 : 0);
    }
  }, [open, isFirstTime]);

  if (!open) return null;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setStoredLanguage(lang);
  };

  // ── Pantalla de selección de idioma ──────────────────────────────────────
  if (step === -1) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-md">
        <div
          className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-3xl animate-slide-up flex flex-col max-h-[92dvh]"
          style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
        >
          {/* Header mínimo — solo botón cerrar */}
          <div className="flex items-center justify-end px-6 pt-5 pb-2 shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {/* Logo / icono de bienvenida */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 flex items-center justify-center mb-6">
              <span className="text-3xl">🌐</span>
            </div>

            <h2 className="text-2xl font-bold text-zinc-100 leading-tight mb-2">
              Elige tu idioma
            </h2>
            <p className="text-[15px] text-zinc-400 mb-8">
              Choose your language · Choisissez votre langue · Wählen Sie Ihre Sprache
            </p>

            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`
                      flex items-center gap-3 px-4 py-4 rounded-2xl border text-left transition-all
                      ${isActive
                        ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300'
                        : 'bg-app-elevated border-app-border text-zinc-300 hover:border-zinc-500'
                      }
                    `}
                  >
                    <span className="text-2xl leading-none">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{lang.label}</p>
                    </div>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón continuar */}
          <div className="px-6 pt-2 shrink-0">
            <button
              onClick={() => setStep(0)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-black font-semibold text-sm active:scale-[0.985] transition-all"
            >
              {t('tutorial.next')}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pasos normales del tutorial ───────────────────────────────────────────
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) { onClose(); return; }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (isFirst && isFirstTime) {
      setStep(-1);
      return;
    }
    if (!isFirst) setStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-3xl animate-slide-up flex flex-col max-h-[92dvh]"
        style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 shrink-0">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums shrink-0">
            {t('tutorial.stepOf', { current: step + 1, total: STEPS.length })}
          </span>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className={`w-16 h-16 rounded-2xl ${current.iconBg} flex items-center justify-center mb-6`}>
            <Icon size={30} className={current.iconColor} />
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 leading-tight mb-4">
            {t(current.titleKey)}
          </h2>

          <p className="text-[15px] leading-7 text-zinc-400 whitespace-pre-line">
            {t(current.bodyKey)}
          </p>

          {current.tipKey && (
            <div className="mt-6 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
              <p className="text-sm text-cyan-200/90 leading-relaxed">
                {t(current.tipKey)}
              </p>
            </div>
          )}
        </div>

        {/* DOT INDICATORS */}
        <div className="flex justify-center gap-2 pb-5 shrink-0">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-300 ${
                i === step ? 'w-6 h-1.5 bg-cyan-400' : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 px-6 shrink-0">
          <button
            onClick={handlePrev}
            disabled={isFirst && !isFirstTime}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-app-border text-zinc-400 hover:text-zinc-200 disabled:opacity-0 disabled:pointer-events-none transition-all font-medium text-sm"
          >
            <ChevronLeft size={16} />
            {t('tutorial.back')}
          </button>

          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-black font-semibold text-sm active:scale-[0.985] transition-all"
          >
            {isLast ? (
              <>
                <CheckCircle2 size={16} />
                {t('tutorial.start')}
              </>
            ) : (
              <>
                {t('tutorial.next')}
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}