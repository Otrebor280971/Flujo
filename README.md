## 💰 Mi App de Finanzas

Una aplicación web progresiva (PWA) construida con React y TypeScript para gestionar tus finanzas personales, hacer seguimiento de múltiples cuentas y controlar tus ingresos y gastos recurrentes.

## ✨ Características Principales

* **Gestión Multicuenta:** Controla de forma separada tu dinero en Débito, Efectivo, Tarjetas de Crédito e Inversiones.
* **Ajuste Rápido de Saldos:** Actualiza el valor real de tus cuentas en cualquier momento para mantener tus finanzas precisas.
* **Ingresos y Gastos Fijos:** Configura transacciones recurrentes (mensuales, quincenales, etc.) para proyectar tu flujo de caja.
* **Soporte Multi-moneda:** Cambia entre divisas (MXN, USD, EUR) según tus necesidades.
* **Instalable en Móvil (PWA):** Úsala como una aplicación nativa en tu celular (iOS y Android) sin necesidad de descargarla de una tienda de aplicaciones.
* **Modo Oscuro Nativo:** Interfaz moderna y elegante construida con Tailwind CSS.

## 🛠️ Tecnologías Utilizadas

* [React 18](https://react.dev/) - Biblioteca principal para la interfaz de usuario.
* [TypeScript](https://www.typescriptlang.org/) - Para un código tipado y seguro.
* [Vite](https://vitejs.dev/) - Empaquetador y entorno de desarrollo ultra rápido.
* [Tailwind CSS](https://tailwindcss.com/) - Para los estilos y diseño responsivo.
* [Lucide React](https://lucide.dev/) - Colección de iconos hermosos y consistentes.
* [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) - Para la funcionalidad de aplicación web progresiva.

## 🚀 Instalación y Desarrollo Local

Para correr este proyecto en tu máquina local, sigue estos pasos:

1. **Clona el repositorio:**
```bash
git clone
cd TU-REPOSITORIO

```

2. **Instala las dependencias:**
```bash
npm install

```


3. **Inicia el servidor de desarrollo:**
```bash
npm run dev

```


4. Abre tu navegador en `http://localhost:5173`

## 📱 Despliegue e Instalación en Móvil (Vercel)

Este proyecto está optimizado para ser desplegado fácilmente en [Vercel](https://vercel.com/):

1. Sube tu código a GitHub.
2. Importa el repositorio en Vercel.
3. Vercel detectará automáticamente la configuración de Vite y hará el *build* (`npm run build`).
4. Una vez desplegado, abre la URL generada por Vercel en el navegador de tu celular (Safari o Chrome).
5. Selecciona la opción **"Compartir"** y luego **"Agregar a la pantalla de inicio"** para instalarla como una app nativa.

## 📁 Estructura Principal

* `/src/components`: Componentes reutilizables de UI (Formatos de moneda, iconos, etc).
* `/src/lib`: Lógica de negocio, base de datos local y cálculos financieros (`db.ts`, `engine.ts`).
* `/public`: Recursos estáticos y los iconos necesarios para la PWA (`icon-192x192.png`, `icon-512x512.png`).