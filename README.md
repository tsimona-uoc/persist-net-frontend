# Persist.NET - Frontend

Aplicación frontend moderna para Persist.NET desarrollada con Vue 3, TypeScript y Tailwind CSS.

## 📋 Descripción del Proyecto

Persist.NET Frontend es una aplicación web de última generación que proporciona una interfaz de usuario interactiva y responsiva. Construida con las tecnologías más modernas de JavaScript/TypeScript, la aplicación ofrece una experiencia de usuario fluida y eficiente.

## 🛠 Stack Tecnológico

### Framework Principal
- **Vue 3** (v3.5.30) - Framework progresivo reactivo para construir interfaces de usuario

### Build Tool & Bundler
- **Vite** (v7.3.1) - Herramienta de construcción siguiente generación con HMR ultra-rápido
  - `@vitejs/plugin-vue` (v6.0.5) - Plugin de Vite para soportar Single File Components de Vue

### Lenguaje
- **TypeScript** (v5.9.3) - Superset de JavaScript que añade tipado estático

### UI & Styling
- **PrimeVue** (v4.5.4) - Librería de componentes UI moderna y versátil
- **@primeuix/themes** (v2.0.3) - Tema Aura (prediseñado) para PrimeVue
- **primeicons** (v7.0.0) - Conjunto de iconos para componentes PrimeVue
- **Tailwind CSS** (v4.2.1) - Framework de utilidades CSS para diseño
- **@tailwindcss/vite** (v4.2.1) - Plugin oficial de Tailwind para Vite
- **tailwindcss-primeui** (v0.6.1) - Integración de componentes PrimeVue con Tailwind CSS

### Herramientas de Desarrollo
- **vue-tsc** (v3.2.5) - Verificador de tipos para archivos Vue
- **@vue/tsconfig** (v0.9.0) - Configuración de TypeScript recomendada para proyectos Vue
- **@types/node** (v24.12.0) - Tipos de TypeScript para Node.js

## 📦 Estructura de Dependencias

### Dependencias de Producción (Runtime)
```json
{
  "@primeuix/themes": "^2.0.3",
  "primeicons": "^7.0.0",
  "primevue": "^4.5.4",
  "tailwindcss-primeui": "^0.6.1",
  "vue": "^3.5.30"
}
```

### Dependencias de Desarrollo (DevDependencies)
```json
{
  "@tailwindcss/vite": "^4.2.1",
  "@types/node": "^24.12.0",
  "@vitejs/plugin-vue": "^6.0.5",
  "@vue/tsconfig": "^0.9.0",
  "tailwindcss": "^4.2.1",
  "typescript": "~5.9.3",
  "vite": "^7.3.1",
  "vue-tsc": "^3.2.5"
}
```

## 🚀 Características Clave

- ⚡ **Rendimiento Ultra-Rápido** - Vite proporciona HMR instantáneo y bundling optimizado
- 🎨 **UI Completa** - Componentes profesionales listos para usar con PrimeVue
- 📱 **Responsive Design** - Tailwind CSS para estilos responsive modernos
- 🔒 **Type-Safe** - TypeScript para mayor seguridad de tipos
- 🎯 **Tema Moderno** - Tema Aura de PrimeUI con colores contemporáneos

## 📥 Instalación

### Requisitos Previos
- Node.js (versión 16 o superior recomendada)
- npm o yarn como gestor de paquetes

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd persist-net-frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`

## 📝 Scripts Disponibles

### Development
```bash
npm run dev
```
Inicia el servidor de desarrollo con HMR (Hot Module Replacement).

### Build
```bash
npm run build
```
Compila la aplicación para producción:
- Ejecuta `vue-tsc` para verificar tipos
- Bundlea con Vite para optimización máxima

### Preview
```bash
npm run preview
```
Previsualiza la compilación de producción localmente.

## 📂 Estructura del Proyecto

```
persist-net-frontend/
├── src/
│   ├── assets/              # Recursos estáticos (imágenes, etc.)
│   ├── components/          # Componentes Vue reutilizables
│   ├── App.vue             # Componente raíz de la aplicación
│   ├── main.ts             # Punto de entrada principal
│   └── style.css           # Estilos globales
├── public/                 # Archivos estáticos servidos directamente
├── index.html              # HTML principal
├── vite.config.ts          # Configuración de Vite
├── tsconfig.json           # Configuración de TypeScript base
├── tsconfig.app.json       # Configuración de TypeScript para app
├── tsconfig.node.json      # Configuración de TypeScript para Node
├── package.json            # Dependencias y scripts del proyecto
└── README.md              # Este archivo
```

## 🔧 Configuración

### Vite (`vite.config.ts`)
- Plugin Vue para SFC (Single File Components)
- Plugin Tailwind CSS con @tailwindcss/vite

### TypeScript (`tsconfig.json`)
- Configuración recomendada para Vue 3
- Tipo de módulo: ES
- Soporte completo para características modernas de JavaScript

## 🎨 Personalización de Temas

La aplicación utiliza el tema **Aura** de PrimeUI. Para cambiar el tema:

1. Editar `src/main.ts`
2. Cambiar la importación de tema de `@primeuix/themes/aura` a otro disponible
3. Reiniciar el servidor de desarrollo

## 📚 Recursos Útiles

- [Documentación de Vue 3](https://vuejs.org/)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de PrimeVue](https://primevue.org/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)
- [Documentación de TypeScript](https://www.typescriptlang.org/)

## 📄 Licencia

Este proyecto forma parte del curso de la UOC (Universitat Oberta de Catalunya).

## 👤 Autor

Proyecto desarrollado como parte del programa educativo de UOC.

---

**Última actualización**: Marzo 2026
