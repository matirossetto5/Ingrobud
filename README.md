# Ingroma — Presupuestos, proyectos y cobros

Herramienta interna de Ingroma para generar presupuestos, gestionarlos y administrar cobros.
PWA responsive (PC, tablet y celular) con Firebase como backend.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- React Router, TanStack Query, Zustand
- Firebase (Auth, Firestore, Storage, Hosting)
- PWA instalable (`vite-plugin-pwa`)

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto de Firebase

1. Andá a [console.firebase.google.com](https://console.firebase.google.com) y creá un proyecto nuevo (ej. `ingroma`).
2. **Authentication** → Sign-in method → habilitá **Email/contraseña**. Luego, en la pestaña Users, creá manualmente tu usuario admin (tu email y una contraseña). No hay alta de usuarios pública: el acceso es solo para vos.
3. **Firestore Database** → creá la base en modo producción (las reglas ya están en `firestore.rules`).
4. **Storage** → activalo (las reglas ya están en `storage.rules`).
5. **Configuración del proyecto** (ícono de engranaje) → **Tus apps** → agregá una app **Web** → copiá el objeto de configuración (`apiKey`, `authDomain`, etc.).

### 3. Variables de entorno

```bash
cp .env.example .env
```

Completá `.env` con los valores del paso anterior.

### 4. Correr en desarrollo

```bash
npm run dev
```

### 5. Desplegar reglas de seguridad

Con la [Firebase CLI](https://firebase.google.com/docs/cli) instalada:

```bash
firebase login
firebase use --add   # elegí tu proyecto
firebase deploy --only firestore:rules,storage:rules
```

> Las reglas (`firestore.rules`, `storage.rules`) restringen todo el acceso a tu email de admin
> (definido ahí mismo). Solo vos podés leer/escribir datos, incluso si alguien más obtiene las
> credenciales públicas del SDK (son públicas por diseño en apps Firebase; la seguridad real la
> dan las reglas, no el `.env`).

## Estado del proyecto

**Fase 1: Setup** ✅
- Scaffold Vite + React + TS + Tailwind
- Conexión a Firebase (Auth/Firestore/Storage)
- Login de admin único
- Layout de navegación (Dashboard, Clientes, Presupuestos, Cobros)
- PWA instalable con la identidad de Ingroma
- Reglas de seguridad de Firestore/Storage

**Fase 2 (actual): Clientes (CRUD)** ✅
- Colección `clientes` en Firestore (nombre, empresa, email, teléfono, dirección, notas)
- Listado con búsqueda por nombre/empresa
- Alta y edición desde un modal
- Baja con confirmación
- Datos servidos con TanStack Query (`src/hooks/useClientes.ts`)

**Fase 3 (actual): Presupuestos (ítems, secciones, PDF)** ✅
- Colección `presupuestos` en Firestore, con numeración autoincremental (`counters/presupuestos`)
- Alta y edición con secciones e ítems dinámicos (cantidad, precio unitario)
- Listado con estado, cliente y total; vista de detalle
- Exportación a PDF (`jspdf` + `jspdf-autotable`, cargado en un chunk aparte)

**Próximas fases**
- Fase 4: Cobros (pagos parciales, saldos)
- Fase 5: Dashboard/reportes de caja
- Fase 6: Pulido PWA
- Fase 7: Deploy

## Despliegue (a definir)

Pendiente de decidir entre Firebase Hosting, Vercel o Netlify. La app es un SPA estático
(`npm run build` genera `dist/`), así que cualquiera de las tres opciones funciona sin cambios.
