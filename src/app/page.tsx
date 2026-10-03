import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#FFF6EC] px-6 text-center">
      <Image
        src="/icons/icon.svg"
        alt=""
        width={96}
        height={96}
        className="rounded-3xl shadow-sm"
        priority
      />
      <h1 className="text-4xl font-semibold tracking-tight text-[#7A3219]">
        Mijote
      </h1>
      <p className="max-w-xs text-balance text-[#7A3219]/80">
        L&apos;encyclopédie de plats, le planning et la liste de courses du
        foyer. Ça mijote, revenez bientôt.
      </p>
    </main>
  );
}
