export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-panel mt-16 px-4 py-6 text-[10px] text-fg-quiet">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-3 justify-between">
        <div className="font-bold tracking-widest text-fg-muted">FUTURERALLY · 2026</div>
        <div className="flex flex-col md:items-end gap-1">
          <div>
            Match data &amp; rankings via{" "}
            <a
              href="https://github.com/JeffSackmann/tennis_atp"
              target="_blank"
              rel="noopener"
              className="underline hover:text-signal-yellow"
            >
              tennis_atp by Jeff Sackmann
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
