import Link from "next/link"
import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ChefHat,
  BarChart3,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard en tiempo real",
    desc: "KPIs de ingresos, margen bruto, ticket promedio y cubiertos actualizados al instante. Sabé exactamente cómo va tu negocio hoy.",
  },
  {
    icon: UtensilsCrossed,
    title: "Ingeniería de menú BCG",
    desc: "Clasificá cada plato como Estrella, Puzzle, Caballo o Perro. Tomá decisiones basadas en datos: qué subir, qué eliminar, qué promover.",
  },
  {
    icon: Sparkles,
    title: "Chatbot Gana con IA",
    desc: "Tu analista financiero personal disponible 24/7. Preguntale cualquier cosa sobre tus ventas, costos o rentabilidad en lenguaje natural.",
  },
  {
    icon: AlertTriangle,
    title: "Detección de fugas",
    desc: "Monitoreo automático de anomalías. GanancIA detecta patrones inusuales en tus costos antes de que se conviertan en pérdidas reales.",
  },
  {
    icon: TrendingUp,
    title: "Predicciones con IA",
    desc: "Forecasting de ventas basado en machine learning. Planificá compras, personal y operaciones con semanas de anticipación.",
  },
  {
    icon: BarChart3,
    title: "Multi-sucursal",
    desc: "Gestioná todas tus sucursales desde un solo lugar. Comparativas, métricas individuales y consolidadas con un clic.",
  },
]

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mes",
    desc: "Para restaurantes con 1 sucursal que quieren tomar el control de su rentabilidad.",
    features: [
      "1 sucursal",
      "Dashboard completo de KPIs",
      "Chatbot Gana con IA",
      "Ingeniería de menú BCG",
      "Reporte semanal por email",
    ],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mes",
    desc: "Para restaurantes que quieren crecer con predicciones avanzadas y alertas automáticas.",
    features: [
      "Hasta 3 sucursales",
      "Todo lo de Starter",
      "Predicciones con machine learning",
      "Alertas automáticas de fugas",
      "Reportes por WhatsApp",
      "Integración con POS",
    ],
    cta: "Empezar gratis",
    highlighted: true,
  },
  {
    name: "Cadena",
    price: "$249",
    period: "/mes",
    desc: "Para cadenas y grupos gastronómicos con múltiples locales y equipos.",
    features: [
      "Sucursales ilimitadas",
      "Todo lo de Pro",
      "API completa",
      "Onboarding dedicado",
      "Marca blanca disponible",
      "Soporte prioritario",
    ],
    cta: "Hablar con ventas",
    highlighted: false,
  },
]

const stats = [
  { value: "7/10", label: "restaurantes cierran antes del primer año" },
  { value: "38%", label: "del costo promedio es comida — controlable con datos" },
  { value: "+20%", label: "de margen recuperable con ingeniería de menú" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display font-black text-2xl text-carbon">
            Gananc<span className="text-bosque">IA</span>
          </span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-carbon transition-colors hidden sm:block">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-carbon transition-colors hidden sm:block">
              Precios
            </a>
            <Link href="/login" className="text-sm text-gray-500 hover:text-carbon transition-colors">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="bg-bosque text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-bosque/90 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-menta text-bosque text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap size={12} />
            Inteligencia financiera para restaurantes latinoamericanos
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl text-carbon leading-tight mb-6">
            Dejá de adivinar.<br />
            <span className="text-bosque">Empezá a ganar.</span>
          </h1>
          <p className="text-gray-500 text-xl leading-relaxed mb-10 max-w-xl">
            GanancIA analiza tus ventas, costos y rentabilidad con IA. Detectá fugas de dinero, optimizá tu menú y tomá decisiones con datos reales — no con intuición.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-bosque text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-bosque/90 transition-colors text-sm"
            >
              Empezar gratis — sin tarjeta <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border-2 border-bosque/20 text-bosque font-semibold px-6 py-3.5 rounded-xl hover:bg-menta/40 transition-colors text-sm"
            >
              Ver demo en vivo
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 pt-16 border-t border-gray-100">
          {stats.map((s) => (
            <div key={s.value}>
              <p className="font-display font-black text-4xl text-bosque mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto bg-carbon rounded-3xl p-8 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Ingresos", value: "$48,320", delta: "+12%", color: "bg-bosque" },
              { label: "Margen bruto", value: "61.3%", delta: "+2.1%", color: "bg-teal" },
              { label: "Ticket promedio", value: "$28.40", delta: "+5%", color: "bg-indigo-500" },
              { label: "Cubiertos", value: "1,703", delta: "+8%", color: "bg-orange-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/50 text-xs uppercase tracking-wide mb-2">{kpi.label}</p>
                <p className="text-white text-2xl font-bold">{kpi.value}</p>
                <span className="text-emerald-400 text-xs font-medium">{kpi.delta} vs mes anterior</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-5">
              <p className="text-white/70 text-sm font-medium mb-4">Ingeniería de Menú</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Estrella", n: 4, color: "text-yellow-400", desc: "Alto margen + popular" },
                  { label: "Puzzle", n: 3, color: "text-blue-400", desc: "Alto margen, bajo vol." },
                  { label: "Caballo", n: 6, color: "text-orange-400", desc: "Popular, bajo margen" },
                  { label: "Perro", n: 2, color: "text-gray-400", desc: "Revisar o eliminar" },
                ].map((b) => (
                  <div key={b.label} className="bg-white/5 rounded-xl p-3">
                    <p className={`text-xs font-bold ${b.color}`}>{b.label}</p>
                    <p className={`text-2xl font-black ${b.color}`}>{b.n}</p>
                    <p className="text-white/40 text-xs">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-bosque flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <p className="text-white/70 text-sm font-medium">Gana IA</p>
              </div>
              <div className="space-y-3">
                {[
                  { role: "user", text: "¿Cuál fue mi plato más rentable esta semana?" },
                  { role: "gana", text: "El Bife de Chorizo lideró con $4,200 de ingreso y 68% de margen. Te recomiendo destacarlo en carta esta noche." },
                  { role: "user", text: "¿Y qué debería eliminar?" },
                  { role: "gana", text: "La Pasta Primavera lleva 3 semanas con margen bajo 30% y solo 8 unidades vendidas. Es candidata a salir del menú." },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-2xl px-3 py-2 text-xs max-w-xs ${
                      m.role === "user" ? "bg-white/10 text-white/80" : "bg-bosque text-white"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl text-carbon mb-4">
              Todo lo que necesitás para
              <span className="text-bosque"> ser rentable</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              GanancIA centraliza toda la inteligencia financiera de tu restaurante en un solo lugar.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="border border-gray-100 rounded-2xl p-6 hover:border-bosque/20 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-menta rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-bosque" />
                </div>
                <h3 className="font-semibold text-carbon mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GANA HIGHLIGHT */}
      <section className="py-20 px-6 bg-carbon">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-bosque rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ChefHat size={28} className="text-white" />
          </div>
          <h2 className="font-display font-black text-4xl text-white mb-4">
            Conocé a <span className="text-teal">Gana</span>
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Tu analista financiero personal con inteligencia artificial. Disponible 24/7, en español, con los datos reales de tu restaurante.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { q: "¿Cuánto vendí el fin de semana?", a: "Vendiste $8,420 entre sábado y domingo, un 18% más que el fin de semana pasado." },
              { q: "¿Cuál es mi plato con peor margen?", a: "La Pasta Primavera tiene apenas 22% de margen. Te recomiendo ajustar el precio o revisar la receta." },
              { q: "¿En qué horario genero más ingresos?", a: "Tu peak es entre las 21:00 y 22:30, con 40% de la facturación diaria en esa ventana." },
            ].map((item) => (
              <div key={item.q} className="bg-white/5 rounded-2xl p-5">
                <p className="text-white/50 text-xs mb-3 italic">"{item.q}"</p>
                <p className="text-white text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl text-carbon mb-4">
              Precios <span className="text-bosque">simples y justos</span>
            </h2>
            <p className="text-gray-500 text-lg">
              Sin sorpresas. Cancelás cuando quieras.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 flex flex-col ${
                  plan.highlighted
                    ? "bg-bosque text-white shadow-xl shadow-bosque/20 scale-105"
                    : "border border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-bold bg-white/20 text-white rounded-full px-3 py-1 w-fit mb-4">
                    Más popular
                  </span>
                )}
                <p className={`text-sm font-semibold mb-1 ${plan.highlighted ? "text-white/70" : "text-gray-500"}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`font-display font-black text-4xl ${plan.highlighted ? "text-white" : "text-carbon"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 leading-relaxed ${plan.highlighted ? "text-white/70" : "text-gray-500"}`}>
                  {plan.desc}
                </p>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={15}
                        className={plan.highlighted ? "text-teal shrink-0" : "text-bosque shrink-0"}
                      />
                      <span className={`text-sm ${plan.highlighted ? "text-white/80" : "text-gray-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Cadena" ? "mailto:hola@ganancia.app" : "/register"}
                  className={`text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-white text-bosque hover:bg-menta"
                      : "border-2 border-bosque/20 text-bosque hover:bg-menta/40"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-menta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-4xl text-carbon mb-4">
            Tu restaurante merece tomar decisiones con datos
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Empezá gratis hoy. Sin tarjeta de crédito. Sin contratos. Configuración en menos de 5 minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-bosque text-white font-semibold px-8 py-4 rounded-xl hover:bg-bosque/90 transition-colors"
          >
            Crear cuenta gratis <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-black text-xl text-carbon">
            Gananc<span className="text-bosque">IA</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="mailto:hola@ganancia.app" className="hover:text-carbon transition-colors">hola@ganancia.app</a>
            <Link href="/login" className="hover:text-carbon transition-colors">Ingresar</Link>
            <Link href="/register" className="hover:text-carbon transition-colors">Registrarse</Link>
          </div>
          <p className="text-xs text-gray-300">© 2026 GanancIA. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
