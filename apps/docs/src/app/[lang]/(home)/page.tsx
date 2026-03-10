import { ArrowRight, Github, MonitorCog, Rocket, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import Link from 'next/link'

type Locale = 'en' | 'pt' | 'es'

type LocalizedContent = {
  announcement: string
  headline: string
  description: string
  primaryCta: string
  secondaryCta: string
  panelLabel: string
  panelDescription: string
  featureEyebrow: string
  socialProof: string[]
  featureTitle: string
  featureDescription: string
  featureCards: Array<{ title: string; description: string }>
  metrics: Array<{ value: string; label: string }>
  workflowEyebrow: string
  workflowTags: [string, string, string]
  workflowTitle: string
  workflowDescription: string
  stepLabel: string
  workflowSteps: string[]
  finalEyebrow: string
  finalTitle: string
  finalDescription: string
  finalCta: string
}

const content: Record<Locale, LocalizedContent> = {
  en: {
    announcement: 'Built for fast-moving engineering teams',
    headline: 'Open, organize, and launch local projects with the menu bar app and Tray Link CLI.',
    description:
      'Tray Link combines a polished menu bar experience with a command-line tool for development workflows, so your team can jump between repositories, editors, and terminals without breaking focus.',
    primaryCta: 'Explore the docs',
    secondaryCta: 'View GitHub',
    panelLabel: 'Tray Link',
    panelDescription: 'Menu bar app + CLI cockpit',
    featureEyebrow: 'Product experience',
    socialProof: ['Menu-bar first UX', 'Built-in CLI', 'Localized experience', 'Made for developer velocity'],
    featureTitle: 'A refined workspace layer for serious builders',
    featureDescription:
      'Designed with a sleek dark interface, elegant motion, and operational clarity that feels at home in high-performance engineering environments.',
    featureCards: [
      {
        title: 'Instant project launch',
        description:
          'Jump into repositories, open editors, and trigger terminal workflows from a single premium command surface backed by the Tray Link CLI.',
      },
      {
        title: 'Team-ready organization',
        description:
          'Structure your local workspaces with predictable flows that keep side projects, client work, and product repos neatly separated.',
      },
      {
        title: 'Confident operations',
        description:
          'Reduce friction in daily development with a clear interface, faster access patterns, and polished system-level ergonomics.',
      },
    ],
    metrics: [
      { value: '3x', label: 'faster context switching' },
      { value: '<1s', label: 'to reach your next repo' },
      { value: '100%', label: 'focused on local-first workflows' },
    ],
    workflowEyebrow: 'Workflow',
    workflowTags: ['macOS native', 'Fast launch', 'Developer-first'],
    workflowTitle: 'Purpose-built for modern local development',
    workflowDescription:
      'From solo founders to scaled product teams, Tray Link creates a smoother handoff between planning, coding, debugging, and shipping across the menu bar app and CLI.',
    stepLabel: 'Step',
    workflowSteps: [
      'Pin the projects that matter most.',
      'Launch your preferred tools instantly.',
      'Keep momentum with less context loss.',
    ],
    finalEyebrow: 'Ready to explore',
    finalTitle: 'Bring a premium operating layer to your developer workflow.',
    finalDescription:
      'Start with the docs, explore the repository, and shape a faster everyday experience around your local projects with both the desktop app and CLI.',
    finalCta: 'Get started now',
  },
  pt: {
    announcement: 'Feito para times de engenharia que se movem rápido',
    headline: 'Abra, organize e inicie projetos locais com o app de menu bar e a CLI do Tray Link.',
    description:
      'O Tray Link combina uma experiência refinada na menu bar com uma ferramenta de linha de comando para fluxos de desenvolvimento, permitindo alternar entre repositórios, editores e terminais sem perder o foco.',
    primaryCta: 'Explorar a documentação',
    secondaryCta: 'Ver no GitHub',
    panelLabel: 'Tray Link',
    panelDescription: 'Cockpit local do app + CLI',
    featureEyebrow: 'Experiência do produto',
    socialProof: [
      'Experiência pensada para a menu bar',
      'CLI integrada',
      'Experiência localizada',
      'Feito para velocidade de desenvolvimento',
    ],
    featureTitle: 'Uma camada de workspace refinada para quem constrói com seriedade',
    featureDescription:
      'Projetado com interface escura elegante, movimento sutil e clareza operacional para ambientes de engenharia de alta performance.',
    featureCards: [
      {
        title: 'Abertura instantânea de projetos',
        description:
          'Acesse repositórios, abra editores e dispare fluxos no terminal a partir de uma única superfície premium apoiada pela CLI do Tray Link.',
      },
      {
        title: 'Organização pronta para equipes',
        description:
          'Estruture seus workspaces locais com fluxos previsíveis para separar side projects, clientes e produtos com clareza.',
      },
      {
        title: 'Operação com confiança',
        description:
          'Reduza atritos no dia a dia com uma interface clara, acesso mais rápido e uma ergonomia polida em nível de sistema.',
      },
    ],
    metrics: [
      { value: '3x', label: 'mais rapidez na troca de contexto' },
      { value: '<1s', label: 'para chegar ao próximo repositório' },
      { value: '100%', label: 'focado em fluxos locais' },
    ],
    workflowEyebrow: 'Fluxo de trabalho',
    workflowTags: ['Nativo para macOS', 'Abertura rápida', 'Pensado para devs'],
    workflowTitle: 'Criado para o desenvolvimento local moderno',
    workflowDescription:
      'De founders solo a times de produto em escala, o Tray Link deixa a passagem entre planejar, codar, depurar e entregar muito mais fluida entre o app e a CLI.',
    stepLabel: 'Etapa',
    workflowSteps: [
      'Fixe os projetos mais importantes.',
      'Abra suas ferramentas preferidas instantaneamente.',
      'Mantenha o ritmo com menos perda de contexto.',
    ],
    finalEyebrow: 'Pronto para explorar',
    finalTitle: 'Leve uma camada operacional premium para o seu fluxo de desenvolvimento.',
    finalDescription:
      'Comece pela documentação, explore o repositório e monte uma experiência diária mais rápida ao redor dos seus projetos locais com o app desktop e a CLI.',
    finalCta: 'Começar agora',
  },
  es: {
    announcement: 'Hecho para equipos de ingeniería que avanzan rápido',
    headline: 'Abre, organiza y lanza proyectos locales con la app de barra de menú y la CLI de Tray Link.',
    description:
      'Tray Link combina una experiencia pulida en la barra de menú con una herramienta de línea de comandos para flujos de desarrollo, para que tu equipo salte entre repositorios, editores y terminales sin perder el foco.',
    primaryCta: 'Explorar la documentación',
    secondaryCta: 'Ver GitHub',
    panelLabel: 'Tray Link',
    panelDescription: 'Centro local de app + CLI',
    featureEyebrow: 'Experiencia del producto',
    socialProof: [
      'Experiencia pensada para la barra de menú',
      'CLI integrada',
      'Experiencia localizada',
      'Creado para velocidad de desarrollo',
    ],
    featureTitle: 'Una capa de workspace refinada para equipos que construyen en serio',
    featureDescription:
      'Diseñado con una interfaz oscura elegante, movimiento sutil y claridad operativa para entornos de ingeniería de alto rendimiento.',
    featureCards: [
      {
        title: 'Apertura instantánea de proyectos',
        description:
          'Entra a repositorios, abre editores y dispara flujos en terminal desde una única superficie premium impulsada por la CLI de Tray Link.',
      },
      {
        title: 'Organización lista para equipos',
        description:
          'Estructura tus workspaces locales con flujos previsibles para separar side projects, clientes y productos con claridad.',
      },
      {
        title: 'Operación con confianza',
        description:
          'Reduce fricción diaria con una interfaz clara, accesos más rápidos y ergonomía pulida a nivel de sistema.',
      },
    ],
    metrics: [
      { value: '3x', label: 'más rapidez al cambiar de contexto' },
      { value: '<1s', label: 'para llegar a tu siguiente repo' },
      { value: '100%', label: 'enfocado en flujos locales' },
    ],
    workflowEyebrow: 'Flujo de trabajo',
    workflowTags: ['Nativo para macOS', 'Lanzamiento rápido', 'Pensado para developers'],
    workflowTitle: 'Pensado para el desarrollo local moderno',
    workflowDescription:
      'Desde founders en solitario hasta equipos de producto en escala, Tray Link hace más fluido el paso entre planear, programar, depurar y enviar entre la app y la CLI.',
    stepLabel: 'Paso',
    workflowSteps: [
      'Fija los proyectos más importantes.',
      'Abre tus herramientas preferidas al instante.',
      'Mantén el impulso con menos pérdida de contexto.',
    ],
    finalEyebrow: 'Listo para explorar',
    finalTitle: 'Lleva una capa operativa premium a tu flujo de desarrollo.',
    finalDescription:
      'Empieza con la documentación, explora el repositorio y construye una experiencia diaria más rápida alrededor de tus proyectos locales con la app de escritorio y la CLI.',
    finalCta: 'Empezar ahora',
  },
}

const repoUrl = 'https://github.com/thejoaov/tray-link'

const featureIcons = [Sparkles, MonitorCog, ShieldCheck] as const

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang = 'en' } = await params
  const locale = (['en', 'pt', 'es'].includes(lang) ? lang : 'en') as Locale
  const copy = content[locale]

  return (
    <div className="relative isolate -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="homepage-noise absolute inset-0 -z-20 opacity-40" />
      <div className="homepage-orb homepage-orb-blue -top-24 left-[8%] -z-10" />
      <div className="homepage-orb homepage-orb-violet top-[22%] right-[6%] -z-10" />
      <div className="homepage-orb homepage-orb-emerald bottom-[18%] left-[18%] -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.14),transparent_24%),radial-gradient(circle_at_30%_80%,rgba(16,185,129,0.12),transparent_28%)]" />

      <section className="homepage-grid relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-7xl flex-col justify-center gap-12">
          <div className="homepage-fade-up max-w-4xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/72 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {copy.announcement}
            </div>

            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <div>
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                  {copy.headline}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/64 sm:text-lg">{copy.description}</p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href={`/${locale}/docs`}
                    className="group inline-flex items-center justify-center gap-2 rounded-full border border-cyan-400/40 bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(96,165,250,0.45)]"
                  >
                    {copy.primaryCta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/6 px-7 py-3.5 text-sm font-medium text-white/84 backdrop-blur-xl transition-all duration-300 hover:border-white/24 hover:bg-white/10 hover:text-white"
                  >
                    <Github className="h-4 w-4" />
                    {copy.secondaryCta}
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  {copy.socialProof.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.2em] text-white/58 uppercase backdrop-blur-xl"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="homepage-float relative rounded-4xl border border-white/12 bg-white/7 p-6 shadow-[0_0_80px_rgba(15,23,42,0.65)] backdrop-blur-2xl">
                <div className="absolute inset-0 rounded-4xl bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(139,92,246,0.1)_50%,rgba(16,185,129,0.12))]" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{copy.panelLabel}</p>
                      <p className="mt-1 text-sm text-white/75">{copy.panelDescription}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.9)]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                    </div>
                  </div>

                  {copy.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/10 bg-black/28 px-5 py-4 transition-transform duration-300 hover:scale-[1.01]"
                    >
                      <div className="text-3xl font-semibold tracking-[-0.05em] text-white">{metric.value}</div>
                      <div className="mt-1 text-sm text-white/56">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="homepage-fade-up mb-12 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{copy.featureEyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              {copy.featureTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/62">{copy.featureDescription}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {copy.featureCards.map((feature, index) => {
              const Icon = featureIcons[index]

              return (
                <article
                  key={feature.title}
                  className="homepage-fade-up group relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/7 p-7 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/10"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_40%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-6 inline-flex rounded-2xl border border-white/10 bg-black/30 p-3 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">{feature.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <div className="homepage-fade-up rounded-4xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">{copy.workflowEyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              {copy.workflowTitle}
            </h2>
            <p className="mt-4 text-base leading-8 text-white/62">{copy.workflowDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-cyan-200">
                {copy.workflowTags[0]}
              </span>
              <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-violet-200">
                {copy.workflowTags[1]}
              </span>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-emerald-200">
                {copy.workflowTags[2]}
              </span>
            </div>
          </div>

          <div className="homepage-fade-up grid gap-4">
            {copy.workflowSteps.map((step, index) => (
              <div
                key={step}
                className="group flex items-start gap-4 rounded-3xl border border-white/12 bg-white/7 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-white/22 hover:bg-white/10"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-white shadow-[0_0_24px_rgba(15,23,42,0.45)]">
                  {index === 0 ? (
                    <Rocket className="h-5 w-5 text-cyan-300" />
                  ) : index === 1 ? (
                    <Workflow className="h-5 w-5 text-violet-300" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-emerald-300" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                    {copy.stepLabel} {index + 1}
                  </p>
                  <p className="mt-2 text-base leading-7 text-white/78">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="homepage-fade-up relative overflow-hidden rounded-[2.2rem] border border-white/14 bg-[linear-gradient(135deg,rgba(8,8,10,0.96),rgba(13,18,30,0.94))] px-6 py-10 shadow-[0_0_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:px-10 lg:px-14 lg:py-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(139,92,246,0.16),transparent_24%),radial-gradient(circle_at_60%_90%,rgba(16,185,129,0.12),transparent_24%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">{copy.finalEyebrow}</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                  {copy.finalTitle}
                </h2>
                <p className="mt-4 text-base leading-8 text-white/64">{copy.finalDescription}</p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href={`/${locale}/docs`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-400/40 bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(96,165,250,0.42)]"
                >
                  {copy.finalCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/6 px-7 py-3.5 text-sm font-medium text-white/84 backdrop-blur-xl transition-all duration-300 hover:border-white/24 hover:bg-white/10 hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
