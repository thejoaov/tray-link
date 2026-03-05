import Link from 'next/link'

const titles: Record<string, string> = {
  en: 'Tray Link',
  pt: 'Tray Link',
  es: 'Tray Link',
}

const descriptions: Record<string, string> = {
  en: 'System tray app to quickly open and manage your local projects.',
  pt: 'Aplicativo na bandeja do sistema para abrir e gerenciar rapidamente seus projetos locais.',
  es: 'Aplicación en la bandeja del sistema para abrir y gestionar rápidamente tus proyectos locales.',
}

const cta: Record<string, string> = {
  en: 'Get Started',
  pt: 'Começar',
  es: 'Empezar',
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang = 'en' } = await params

  return (
    <div className="flex flex-col justify-center items-center text-center flex-1 gap-6 py-16">
      <img
        src="https://raw.githubusercontent.com/thejoaov/tray-link/main/assets/icon%403x.png"
        alt="Tray Link"
        width={90}
        height={90}
      />
      <h1 className="text-4xl font-bold">{titles[lang] ?? titles.en}</h1>
      <p className="text-lg text-fd-muted-foreground max-w-md">{descriptions[lang] ?? descriptions.en}</p>
      <Link
        href={`/${lang ?? 'en'}/docs`}
        className="inline-flex items-center justify-center rounded-md bg-fd-primary text-fd-primary-foreground px-6 py-3 text-sm font-medium shadow hover:bg-fd-primary/90 transition-colors"
      >
        {cta[lang] ?? cta.en}
      </Link>
    </div>
  )
}
