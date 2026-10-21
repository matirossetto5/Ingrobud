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

## Testear localmente (sin tocar Firebase real)

Para probar la app sin depender del proyecto de Firebase real (y sin necesidad de hacer commits
o deploys para cada prueba), podés usar los [Firebase Local Emulators](https://firebase.google.com/docs/emulator-suite):

1. Instalá la Firebase CLI si no la tenés: `npm install -g firebase-tools`.
2. En `.env`, poné `VITE_USE_FIREBASE_EMULATOR=true` (no hace falta completar las demás variables
   de Firebase en este modo).
3. Levantá los emuladores (Auth, Firestore, Storage) en una terminal:
   ```bash
   npm run emulators
   ```
   Esto abre la UI de los emuladores en `http://127.0.0.1:4000`, donde podés ver/crear usuarios
   y datos de prueba a mano.
4. En otra terminal, levantá la app normalmente:
   ```bash
   npm run dev
   ```

Con `VITE_USE_FIREBASE_EMULATOR=true`, `src/lib/firebase.ts` conecta el SDK a los emuladores
locales en vez del proyecto real. Los datos viven solo en memoria del emulador (se pueden
exportar/importar con `firebase emulators:start --export-on-exit --import=./emulator-data` si
querés persistirlos entre sesiones) y nunca tocan Firestore/Storage/Auth de producción. Como todo
corre en tu máquina, podés iterar y probar cambios libremente sin necesidad de pushear nada al
repo hasta que estés conforme.

## Estado del proyecto

**Fase 1: Setup** ✅
- Scaffold Vite + React + TS + Tailwind
- Conexión a Firebase (Auth/Firestore/Storage)
- Login de admin único
- Layout de navegación (Dashboard, Clientes, Presupuestos, Cobros)
- PWA instalable con la identidad de Ingroma
- Reglas de seguridad de Firestore/Storage

**Fase 2: Clientes (CRUD)** ✅
- Colección `clientes` en Firestore (nombre, empresa, email, teléfono, dirección, notas)
- Listado con búsqueda por nombre/empresa
- Alta y edición desde un modal
- Baja con confirmación
- Datos servidos con TanStack Query (`src/hooks/useClientes.ts`)

**Fase 3: Presupuestos (ítems, secciones, PDF)** ✅
- Colección `presupuestos` en Firestore, con numeración autoincremental (`counters/presupuestos`)
- Alta y edición con secciones e ítems dinámicos (cantidad, precio unitario)
- Listado con estado, cliente y total; vista de detalle
- Exportación a PDF (`jspdf` + `jspdf-autotable`, cargado en un chunk aparte)

**Fase 4 (actual): Cobros (pagos parciales, saldos)** ✅
- Colección `pagos` en Firestore, asociados a un presupuesto y un cliente
- Listado de presupuestos con total, cobrado y saldo pendiente (soporta pagos parciales)
- Registro de pagos desde un modal (fecha, monto, método, notas) y baja con confirmación
- Historial de pagos

**Fase 5 (actual): Dashboard/reportes de caja** ✅
- Cobrado del mes, pendiente de cobro total y presupuestos enviados
- Listado de saldos pendientes y últimos pagos
- Últimos presupuestos con su estado

**Fase 6 (actual): Pulido PWA** ✅
- Aviso de actualización disponible y de app lista para uso offline (`virtual:pwa-register/react`)
- Botón "Instalar app" (desktop y mobile) usando `beforeinstallprompt`
- Banner de "sin conexión" cuando se pierde la red
- `navigateFallback` a `index.html` para navegación offline y metatags iOS (`apple-mobile-web-app-*`)

**Fase 7 (actual): Revisiones de presupuestos** ✅
- Cada presupuesto tiene una revisión vigente (`Rev. 0` es la original) y un historial de versiones anteriores
- "Nueva revisión" (desde el detalle) pide el motivo, archiva la versión vigente tal cual en
  `presupuestos/{id}/revisiones/{n}` y abre la siguiente como borrador para editarla
- Historial con fecha, estado, motivo y total de cada revisión; las anteriores se pueden ver (solo lectura)
  y descargar en PDF
- El PDF y el listado muestran el número de revisión (`presupuesto-12-rev1.pdf`)
- Al eliminar un presupuesto se borra también su historial

**Fase 8 (actual): Ficha del cliente y PDF con identidad de Ingroma** ✅
- Ficha en `/clientes/:id`: datos de contacto, totales (aprobado, cobrado, saldo pendiente de lo aprobado),
  presupuestos del cliente con su cobrado/saldo y pagos registrados
- "Nuevo presupuesto" desde la ficha llega con el cliente ya elegido (`/presupuestos/nuevo?cliente=<id>`)
- PDF rediseñado: logo, datos de contacto de la empresa (`src/lib/empresa.ts`), recuadro con los datos
  completos del cliente, total destacado, pie con firma profesional y numeración de páginas
- Saldos pendientes (Cobros, Dashboard y ficha) cuentan solo presupuestos **aprobados**
  (`esCobrable`/`saldoPendiente` en `src/lib/cobros.ts`). Un presupuesto con pagos que deja de estar
  aprobado (p. ej. pasa a una nueva revisión en borrador) sigue listado en Cobros, sin sumar al pendiente

**Fase 9 (actual): Forma de pago por etapas y actualización por índice CAC** ✅
- Moneda por presupuesto: **ARS** (se actualiza por CAC) o **USD** (sin actualización). Totales
  de Cobros, Dashboard y ficha separados por moneda
- Plan de pagos por etapas (anticipo, etapas intermedias, final) cargando % o monto; los porcentajes
  tienen que sumar 100%
- Mes base de la cotización (ARS), cargado a mano, y pantalla **Índices CAC** (`indicesCac/{YYYY-MM}`)
  para cargar a mano el índice mensual (nivel general)
- Cada pago cancela un monto **a valores base** y se cobra actualizado:
  `cobrado = base × máx(1, CAC(mes aplicado) / CAC(mes base))`. El mes del índice aplicado se elige a mano
  en cada pago y el monto nunca queda por debajo del base. Lo ya cobrado queda congelado y solo lo
  pendiente se sigue actualizando
- Cobranza por etapa en el detalle del presupuesto (cancelado, pendiente y pendiente actualizado al
  último CAC), con registro de pago por etapa
- PDF con tabla de forma de pago y cláusula de moneda/actualización
- Pagos y presupuestos anteriores siguen funcionando: se toman como pesos sin actualización

**Fase 10 (actual): Recibos de pago** ✅
- Recibo en PDF por pago con número correlativo (`counters/recibos`, asignado al registrar el pago en la
  misma transacción; los pagos anteriores reciben número al emitir su primer recibo)
- Monto en letras, concepto (etapa y presupuesto), forma de pago, detalle de la actualización CAC
  (monto base, índices, coeficiente) y estado de cuenta del presupuesto después del pago
- "Registrar y emitir recibo" al cargar el pago, y descarga desde Cobros, la cobranza del presupuesto y
  la ficha del cliente
- Cada pago guarda los valores de índice usados, así el recibo no cambia si después se corrige la tabla

**Próximas fases**
- Fase 11: Deploy

## Despliegue (a definir)

Pendiente de decidir entre Firebase Hosting, Vercel o Netlify. La app es un SPA estático
(`npm run build` genera `dist/`), así que cualquiera de las tres opciones funciona sin cambios.
