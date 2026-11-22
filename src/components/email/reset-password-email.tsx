import { getIntlayer } from "intlayer";
import Image from "next/image";

/**
 * The password-reset email, as designed. Plain markup with the content from the `reset-email` dictionary, so the
 * same component can be rendered for a real mail. `url` is the link behind the button and the fallback text.
 */
export function ResetPasswordEmail({ locale, url }: { locale: string; url: string }) {
  const content = getIntlayer("reset-email", locale);

  return (
    <article className="w-full max-w-[36.25rem] overflow-hidden rounded-[4px] bg-linear-to-br from-[#53479d] via-[#3b3278] to-[#241d47] px-6 py-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <header className="flex items-center justify-center gap-2">
        <Image src="/logo.png" alt="" width={22} height={22} />
        <span className="text-[1.0625rem] leading-6 font-semibold">{content.brand}</span>
      </header>

      <div className="relative mx-auto mt-6 max-w-[24.5rem] overflow-hidden rounded-[10px] bg-[#16122e] px-8 py-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        {/* Faint logo bleeding out of the bottom of the card */}
        <Image
          aria-hidden
          src="/logo.png"
          alt=""
          width={169}
          height={167}
          className="pointer-events-none absolute -bottom-16 left-1/2 w-[10.5rem] -translate-x-1/2 opacity-[0.07]"
        />

        <h1 className="relative text-[1.375rem] leading-7 font-semibold">{content.title}</h1>

        <a
          href={url}
          className="relative mt-8 inline-block rounded-[6px] bg-primary-400 px-6 py-2.5 text-sx leading-5 font-medium text-white hover:bg-primary-300"
        >
          {content.action}
        </a>

        <p className="relative mt-8 text-[0.8125rem] leading-[1.5] text-white/70">{content.body}</p>
        <p className="relative mt-4 text-xs leading-[1.5] text-white/45">{content.ignore}</p>

        <p className="relative mt-6 text-[0.6875rem] leading-4 text-white/45">
          {content.copyLink}
          <br />
          <a href={url} className="break-all text-[#b9a8ff] underline-offset-2 hover:underline">
            {url}
          </a>
        </p>
      </div>

      <footer className="mt-6 text-center text-xs leading-4 text-white/55">
        {content.footerBefore} <span className="underline">Histia</span>. {content.footerAfter}
      </footer>
    </article>
  );
}
