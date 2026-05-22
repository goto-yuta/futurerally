export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-panel mt-12 px-4 py-5 text-[10px] text-fg-quiet">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        <div className="font-bold tracking-widest text-fg-muted">ULTIMATE FOREHAND · 2026</div>
        <div className="flex flex-col gap-1">
          <div>
            Match data &amp; rankings via{" "}
            <a
              href="https://github.com/JeffSackmann/tennis_atp"
              target="_blank"
              rel="noopener"
              className="underline hover:text-signal-yellow"
            >
              tennis_atp / tennis_wta by Jeff Sackmann
            </a>
            {" "}(
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener"
              className="underline hover:text-signal-yellow"
            >
              CC BY-NC-SA 4.0
            </a>
            )
          </div>
          <div>Non-commercial preview build</div>
        </div>
      </div>
    </footer>
  );
}
