// Transition douce à chaque changement de page (CSS : fonctionne même sans JavaScript).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-[page-in_0.8s_cubic-bezier(0.22,1,0.36,1)_both]">{children}</div>;
}
