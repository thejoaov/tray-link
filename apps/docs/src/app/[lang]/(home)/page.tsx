import { ArrowRight, Github, MonitorCog, Rocket, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import Link from 'next/link'
import { type InstallMethodOption, InstallTerminals } from '@/components/home/install-terminals'

const repoUrl = 'https://github.com/thejoaov/tray-link'
const latestReleaseApiUrl = 'https://api.github.com/repos/thejoaov/tray-link/releases/latest'

type Locale = 'en' | 'pt' | 'es'

type LocalizedContent = {
  announcement: string
  headline: string
  description: string
  primaryCta: string
  secondaryCta: string
  terminalEyebrow: string
  terminalTitle: string
  terminalDescription: string
  installMethods: InstallMethodOption[]
  copyCommandLabel: string
  copiedCommandLabel: string
  downloadLabel: string
  downloadingLabel: string
  assetNotFoundLabel: string
  filePatternLabel: string
  instructionsLabel: string
  commandLabel: string
  featureEyebrow: string
  socialProof: string[]
  featureTitle: string
  featureDescription: string
  featureCards: Array<{ title: string; description: string }>
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

const featureIcons = [Sparkles, MonitorCog, ShieldCheck] as const

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const content: Record<Locale, LocalizedContent> = {
    en: {
      announcement: 'Built for fast-moving engineering teams',
      headline: 'Open, organize, and launch local projects with the menu bar app and Tray Link CLI.',
      description:
        'Tray Link combines a polished menu bar experience with a command-line tool for development workflows, so your team can jump between repositories, editors, and terminals without breaking focus.',
      primaryCta: 'Explore the docs',
      secondaryCta: 'View GitHub',
      terminalEyebrow: 'Developer setup',
      terminalTitle: 'Install it like a real dev tool',
      terminalDescription:
        'Pick the package format for your platform, download the latest asset directly, and follow the exact install steps for your environment.',
      installMethods: [
        {
          id: 'homebrew-macos',
          label: 'Homebrew (macOS)',
          description:
            'Recommended if you want a Homebrew-based install on macOS. This path installs the Apple Silicon Homebrew cask.',
          steps: [
            'Install Homebrew if it is not already available on your Mac.',
            'Run the install commands in your terminal.',
            'Open Tray Link from Applications or Spotlight after the cask finishes installing.',
            'If macOS blocks first launch, run the xattr command shown in the terminal panel.',
            'To update later, run brew upgrade --cask tray-link.',
          ],
          command:
            'brew tap thejoaov/tray-link\nbrew install --cask tray-link\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app',
        },
        {
          id: 'linux-fedora',
          label: 'Linux Fedora',
          description:
            'Download the RPM package from the latest GitHub release and install it with your system package manager.',
          // TODO: Version fetched
          filename: `tray-link-{version}-1.x86_64.rpm`,
          // TODO: Version fetched
          assetPattern: `tray-link-{version}-1.x86_64.rpm`,
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Click the download button to fetch the latest RPM package.',
            'Install the downloaded package with rpm.',
            'Launch Tray Link from your applications menu or system tray after installation.',
          ],
          // TODO: Version fetched
          command: 'sudo rpm -i tray-link-{version}-1.x86_64.rpm',
        },
        {
          id: 'linux-debian',
          label: 'Linux Debian',
          description:
            'Download the DEB package from the latest GitHub release and install it on Debian or Ubuntu-based systems.',
          // TODO: Version fetched
          filename: 'tray-link_{version}_amd64.deb',
          // TODO: Version fetched
          assetPattern: 'tray-link_{version}_amd64.deb',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Click the download button to fetch the latest DEB package.',
            'Install the downloaded package with dpkg.',
            'Open Tray Link from your applications menu or system tray after installation.',
          ],
          // TODO: Version fetched
          command: 'sudo dpkg -i tray-link_{version}_amd64.deb',
        },
        {
          id: 'macos-intel',
          label: 'macOS (Intel x86)',
          description: 'Use the universal macOS ZIP package if you want the manual installation flow on Intel Macs.',
          filename: 'Tray-Link-macOS-universal.zip',
          assetPattern: 'Tray-Link-macOS-universal.zip',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Click the download button to fetch the latest universal ZIP package.',
            'Unzip the archive and move Tray Link.app into /Applications.',
            'If macOS blocks first launch, run the xattr command shown in the terminal panel.',
          ],
          command:
            "unzip Tray-Link-macOS-universal.zip\ncp -R 'Tray Link.app' /Applications/\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app",
        },
        {
          id: 'macos-arm64',
          label: 'macOS (Apple Silicon)',
          description: 'Use the dedicated Apple Silicon ZIP package if you want the manual install flow on arm64 Macs.',
          // TODO: Version fetched
          filename: 'Tray.Link-darwin-arm64-{version}.zip',
          // TODO: Version fetched
          assetPattern: 'Tray.Link-darwin-arm64-{version}.zip',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Click the download button to fetch the latest Apple Silicon ZIP package.',
            'Unzip the archive and move Tray Link.app into /Applications.',
            'If macOS blocks first launch, run the xattr command shown in the terminal panel.',
          ],
          command:
            // TODO: Version fetched
            "unzip Tray.Link-darwin-arm64-{version}.zip\ncp -R 'Tray Link.app' /Applications/\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app",
        },
        {
          id: 'windows-setup',
          label: 'Windows',
          description: 'Use the installer package for the standard Windows installation flow.',
          // TODO: Version fetched
          filename: 'Tray.Link-{version}.Setup.exe',
          // TODO: Version fetched
          assetPattern: 'Tray.Link-{version}.Setup.exe',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Click the download button to fetch the latest Setup.exe installer.',
            'Run the installer and follow the Windows prompts.',
            'Open Tray Link from the Start menu after installation finishes.',
          ],
        },
        {
          id: 'windows-nuget',
          label: 'Windows (NuGet)',
          description: 'Use the full NuGet package if you prefer that distribution format on Windows.',
          // TODO: Version fetched
          filename: 'TrayLink-{version}-full.nupkg',
          // TODO: Version fetched
          assetPattern: 'TrayLink-{version}-full.nupkg',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Click the download button to fetch the latest .nupkg package.',
            'Extract the package contents with your preferred archive or NuGet tool.',
            'Place the unpacked app where you manage desktop tools and launch Tray Link from there.',
          ],
        },
      ],
      copyCommandLabel: 'Copy',
      copiedCommandLabel: 'Copied',
      downloadLabel: 'Download latest',
      downloadingLabel: 'Downloading...',
      assetNotFoundLabel: 'Could not find the expected file in the latest release.',
      filePatternLabel: 'Download file',
      instructionsLabel: 'Instructions',
      commandLabel: 'Terminal commands',
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
      terminalEyebrow: 'Setup para devs',
      terminalTitle: 'Escolha o método de instalação do seu sistema',
      terminalDescription:
        'Selecione o formato correto para sua plataforma, baixe o asset mais recente diretamente e siga os passos exatos de instalação.',
      installMethods: [
        {
          id: 'homebrew-macos',
          label: 'Homebrew (macOS)',
          description:
            'Recomendado se você quer instalar pelo Homebrew no macOS. Esse fluxo instala o cask do Homebrew para Apple Silicon.',
          steps: [
            'Instale o Homebrew caso ele ainda não esteja disponível no seu Mac.',
            'Execute os comandos de instalação no terminal.',
            'Abra o Tray Link pelo Applications ou Spotlight quando o cask terminar de instalar.',
            'Se o macOS bloquear a primeira abertura, rode o comando xattr mostrado no terminal.',
            'Para atualizar depois, rode brew upgrade --cask tray-link.',
          ],
          command:
            'brew tap thejoaov/tray-link\nbrew install --cask tray-link\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app',
        },
        {
          id: 'linux-fedora',
          label: 'Linux Fedora',
          description:
            'Baixe o pacote RPM na release mais recente do GitHub e instale com o gerenciador de pacotes do sistema.',
          // TODO: Version fetched
          filename: 'tray-link-{version}-1.x86_64.rpm',
          // TODO: Version fetched
          assetPattern: 'tray-link-{version}-1.x86_64.rpm',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Clique no botão de download para baixar o pacote RPM mais recente.',
            'Instale o pacote baixado com rpm.',
            'Abra o Tray Link pelo menu de aplicativos ou system tray após a instalação.',
          ],
          // TODO: Version fetched
          command: 'sudo rpm -i tray-link-{version}-1.x86_64.rpm',
        },
        {
          id: 'linux-debian',
          label: 'Linux Debian',
          description: 'Baixe o pacote DEB na release mais recente do GitHub e instale em sistemas Debian ou Ubuntu.',
          // TODO: Version fetched
          filename: 'tray-link_{version}_amd64.deb',
          // TODO: Version fetched
          assetPattern: 'tray-link_{version}_amd64.deb',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Clique no botão de download para baixar o pacote DEB mais recente.',
            'Instale o pacote baixado com dpkg.',
            'Abra o Tray Link pelo menu de aplicativos ou system tray após a instalação.',
          ],
          // TODO: Version fetched
          command: 'sudo dpkg -i tray-link_{version}_amd64.deb',
        },
        {
          id: 'macos-intel',
          label: 'MacOS (Intel x86)',
          description: 'Use o ZIP universal do macOS se você quiser o fluxo manual de instalação em Macs Intel.',
          filename: 'Tray-Link-macOS-universal.zip',
          assetPattern: 'Tray-Link-macOS-universal.zip',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Clique no botão de download para baixar o ZIP universal mais recente.',
            'Descompacte o arquivo e mova o Tray Link.app para /Applications.',
            'Se o macOS bloquear a primeira abertura, rode o comando xattr mostrado no terminal.',
          ],
          command:
            "unzip Tray-Link-macOS-universal.zip\ncp -R 'Tray Link.app' /Applications/\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app",
        },
        {
          id: 'macos-arm64',
          label: 'MacOS (Apple Silicon)',
          description: 'Use o ZIP dedicado para Apple Silicon se você quiser o fluxo manual em Macs arm64.',
          // TODO: Version fetched
          filename: 'Tray.Link-darwin-arm64-{version}.zip',
          // TODO: Version fetched
          assetPattern: 'Tray.Link-darwin-arm64-{version}.zip',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Clique no botão de download para baixar o ZIP mais recente para Apple Silicon.',
            'Descompacte o arquivo e mova o Tray Link.app para /Applications.',
            'Se o macOS bloquear a primeira abertura, rode o comando xattr mostrado no terminal.',
          ],
          command:
            // TODO: Version fetched
            "unzip Tray.Link-darwin-arm64-{version}.zip\ncp -R 'Tray Link.app' /Applications/\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app",
        },
        {
          id: 'windows-setup',
          label: 'Windows',
          description: 'Use o instalador padrão para o fluxo normal de instalação no Windows.',
          // TODO: Version fetched
          filename: 'Tray.Link-{version}.Setup.exe',
          // TODO: Version fetched
          assetPattern: 'Tray.Link-{version}.Setup.exe',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Clique no botão de download para baixar o instalador Setup.exe mais recente.',
            'Execute o instalador e siga as telas do Windows.',
            'Abra o Tray Link pelo menu Iniciar após a instalação terminar.',
          ],
        },
        {
          id: 'windows-nuget',
          label: 'Windows (NuGet)',
          description: 'Use o pacote NuGet completo se você preferir esse formato de distribuição no Windows.',
          // TODO: Version fetched
          filename: 'TrayLink-{version}-full.nupkg',
          // TODO: Version fetched
          assetPattern: 'TrayLink-{version}-full.nupkg',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Clique no botão de download para baixar o pacote .nupkg mais recente.',
            'Extraia o conteúdo com a ferramenta de arquivo ou de NuGet de sua preferência.',
            'Coloque o app extraído em um local onde você gerencia ferramentas desktop e abra o Tray Link por lá.',
          ],
        },
      ],
      copyCommandLabel: 'Copiar',
      copiedCommandLabel: 'Copiado',
      downloadLabel: 'Baixar última versão',
      downloadingLabel: 'Baixando...',
      assetNotFoundLabel: 'Não foi possível encontrar o arquivo esperado na release mais recente.',
      filePatternLabel: 'Arquivo para baixar',
      instructionsLabel: 'Instruções',
      commandLabel: 'Comandos de terminal',
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
      terminalEyebrow: 'Setup para devs',
      terminalTitle: 'Elige el método de instalación para tu sistema',
      terminalDescription:
        'Selecciona el formato correcto para tu plataforma, descarga el asset más reciente directamente y sigue los pasos exactos de instalación.',
      installMethods: [
        {
          id: 'homebrew-macos',
          label: 'Homebrew (macOS)',
          description:
            'Recomendado si quieres instalarlo con Homebrew en macOS. Este flujo instala el cask de Homebrew para Apple Silicon.',
          steps: [
            'Instala Homebrew si todavía no está disponible en tu Mac.',
            'Ejecuta los comandos de instalación en tu terminal.',
            'Abre Tray Link desde Applications o Spotlight cuando el cask termine de instalarse.',
            'Si macOS bloquea el primer inicio, ejecuta el comando xattr mostrado en el panel del terminal.',
            'Para actualizar después, ejecuta brew upgrade --cask tray-link.',
          ],
          command:
            'brew tap thejoaov/tray-link\nbrew install --cask tray-link\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app',
        },
        {
          id: 'linux-fedora',
          label: 'Linux Fedora',
          description:
            'Descarga el paquete RPM desde la latest release de GitHub e instálalo con el gestor de paquetes del sistema.',
          // TODO: Version fetched
          filename: 'tray-link-{version}-1.x86_64.rpm',
          // TODO: Version fetched
          assetPattern: 'tray-link-{version}-1.x86_64.rpm',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Haz clic en el botón de descarga para bajar el paquete RPM más reciente.',
            'Instala el paquete descargado con rpm.',
            'Abre Tray Link desde tu menú de aplicaciones o system tray después de la instalación.',
          ],
          // TODO: Version fetched
          command: 'sudo rpm -i tray-link-{version}-1.x86_64.rpm',
        },
        {
          id: 'linux-debian',
          label: 'Linux Debian',
          description:
            'Descarga el paquete DEB desde la latest release de GitHub e instálalo en sistemas Debian o Ubuntu.',
          // TODO: Version fetched
          filename: 'tray-link_{version}_amd64.deb',
          // TODO: Version fetched
          assetPattern: 'tray-link_{version}_amd64.deb',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Haz clic en el botón de descarga para bajar el paquete DEB más reciente.',
            'Instala el paquete descargado con dpkg.',
            'Abre Tray Link desde tu menú de aplicaciones o system tray después de la instalación.',
          ],
          // TODO: Version fetched
          command: 'sudo dpkg -i tray-link_{version}_amd64.deb',
        },
        {
          id: 'macos-intel',
          label: 'MacOS (Intel x86)',
          description: 'Usa el ZIP universal de macOS si quieres el flujo manual de instalación en Macs Intel.',
          filename: 'Tray-Link-macOS-universal.zip',
          assetPattern: 'Tray-Link-macOS-universal.zip',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Haz clic en el botón de descarga para bajar el ZIP universal más reciente.',
            'Descomprime el archivo y mueve Tray Link.app a /Applications.',
            'Si macOS bloquea el primer inicio, ejecuta el comando xattr mostrado en el panel del terminal.',
          ],
          command:
            "unzip Tray-Link-macOS-universal.zip\ncp -R 'Tray Link.app' /Applications/\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app",
        },
        {
          id: 'macos-arm64',
          label: 'MacOS (Apple Silicon)',
          description: 'Usa el ZIP dedicado para Apple Silicon si quieres el flujo manual en Macs arm64.',
          // TODO: Version fetched
          filename: 'Tray.Link-darwin-arm64-{version}.zip',
          // TODO: Version fetched
          assetPattern: 'Tray.Link-darwin-arm64-{version}.zip',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Haz clic en el botón de descarga para bajar el ZIP más reciente para Apple Silicon.',
            'Descomprime el archivo y mueve Tray Link.app a /Applications.',
            'Si macOS bloquea el primer inicio, ejecuta el comando xattr mostrado en el panel del terminal.',
          ],
          command:
            // TODO: Version fetched
            "unzip Tray.Link-darwin-arm64-{version}.zip\ncp -R 'Tray Link.app' /Applications/\nxattr -d com.apple.quarantine /Applications/Tray\\ Link.app",
        },
        {
          id: 'windows-setup',
          label: 'Windows',
          description: 'Usa el instalador estándar para el flujo normal de instalación en Windows.',
          // TODO: Version fetched
          filename: 'Tray.Link-{version}.Setup.exe',
          // TODO: Version fetched
          assetPattern: 'Tray.Link-{version}.Setup.exe',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Haz clic en el botón de descarga para bajar el instalador Setup.exe más reciente.',
            'Ejecuta el instalador y sigue los pasos de Windows.',
            'Abre Tray Link desde el menú Inicio cuando la instalación termine.',
          ],
        },
        {
          id: 'windows-nuget',
          label: 'Windows (NuGet)',
          description: 'Usa el paquete NuGet completo si prefieres ese formato de distribución en Windows.',
          // TODO: Version fetched
          filename: 'TrayLink-{version}-full.nupkg',
          // TODO: Version fetched
          assetPattern: 'TrayLink-{version}-full.nupkg',
          releaseUrl: latestReleaseApiUrl,
          steps: [
            'Haz clic en el botón de descarga para bajar el paquete .nupkg más reciente.',
            'Extrae el contenido con tu herramienta de archivos o NuGet preferida.',
            'Coloca la app descomprimida donde administras tus herramientas de escritorio y abre Tray Link desde ahí.',
          ],
        },
      ],
      copyCommandLabel: 'Copiar',
      copiedCommandLabel: 'Copiado',
      downloadLabel: 'Descargar última versión',
      downloadingLabel: 'Descargando...',
      assetNotFoundLabel: 'No se pudo encontrar el archivo esperado en la latest release.',
      filePatternLabel: 'Archivo para descargar',
      instructionsLabel: 'Instrucciones',
      commandLabel: 'Comandos de terminal',
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

  const _fetchLatestReleaseTag = async () => {
    // Fetch with github api token
    const response = await fetch(latestReleaseApiUrl)
    const data = await response.json()
    return data.tag_name
  }

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
          <div className="homepage-fade-up w-full max-w-7xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/72 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {copy.announcement}
            </div>

            <div className="flex flex-col gap-10 min-[600px]:grid min-[600px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[600px]:items-start xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)] xl:items-end">
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

              <InstallTerminals
                eyebrow={copy.terminalEyebrow}
                title={copy.terminalTitle}
                description={copy.terminalDescription}
                methods={copy.installMethods}
                copyLabel={copy.copyCommandLabel}
                copiedLabel={copy.copiedCommandLabel}
                downloadLabel={copy.downloadLabel}
                downloadingLabel={copy.downloadingLabel}
                instructionsLabel={copy.instructionsLabel}
                commandLabel={copy.commandLabel}
                assetNotFoundLabel={copy.assetNotFoundLabel}
              />
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
