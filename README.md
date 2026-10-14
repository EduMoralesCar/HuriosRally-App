# 🏁 Hurios Rally - Aplicación Móvil de Repuestos Automotrices

<div align="center">
  <h3>Sistema Integral de Comercio, Cotización en Mostrador y Control de Almacén</h3>
  <p>Desarrollado para <b>HURIOS RALLY E.I.R.L.</b> — San Martín de Porres, Lima Norte</p>
</div>

---

## 📌 Descripción del Proyecto

**Hurios Rally App** es una aplicación móvil desarrollada en **React Native con Expo y TypeScript**, diseñada para digitalizar y optimizar las operaciones comerciales de repuestos automotrices. El sistema cuenta con arquitectura por roles que permite una experiencia personalizada para **Clientes**, **Asesores de Ventas** y **Almaceneros**.

---

## ✨ Características Principales

### 🔐 1. Módulo de Autenticación & Seguridad
- **Inicio de sesión corporativo** con validación y acceso rápido a cuentas demo.
- **Autogeneración inteligente de credenciales**: Al ingresar nombre y seleccionar rol, el sistema genera automáticamente el usuario (`nombre_apellido`) y correo corporativo (`.ventas@`, `.almacen@`, `.cliente@`).
- **Recuperación de contraseña en 3 pasos** con código de seguridad de 6 dígitos (integración con microservicio SMTP en Node.js y código de respaldo local).
- **Acceso biométrico** (Huella dactilar) configurable desde el perfil.

### 🚗 2. Catálogo de Repuestos & Búsqueda Técnica
- Catálogo interactivo de repuestos con especificaciones técnicas completas y códigos **OEM**.
- Barra de búsqueda reactiva por nombre, código OEM o compatibilidad vehicular.
- Filtro por **Familias Técnicas**: Frenos, Suspensión, Motor, Filtros y Accesorios.
- Ficha de detalle de repuesto (`DetailScreen`) y lista de repuestos guardados / favoritos.

### 💳 3. Carrito de Compras & Pasarela de Pagos (Core del Negocio)
- Contexto de carrito global (`CartContext`) con badge dinámico en tiempo real.
- Resumen financiero con cálculo automático de **Subtotal**, **IGV (18%)** y Total estimado.
- Pasarela multimodal de pagos:
  - 📲 **Yape / Plin** (con registro de número de operación).
  - 💳 **Tarjeta Débito/Crédito** (con interfaz SSL protegida).
  - 📍 **Contraentrega / Mostrador SMP** (pago al recoger en tienda).
- Emisión de comprobantes: **Boleta Electrónica** (DNI) y **Factura Comercial** (RUC 11 dígitos).
- Generación de órdenes oficiales (`PED-XXXX`) persistentes en almacenamiento local.

### 💼 4. Módulo para Asesor de Ventas (Modo Mostrador / ERP)
- **Modo Mostrador**: Cabecera identificadora del colaborador y navegación adaptada (*Mostrador*, *Familias*, *Frecuentes*, *Cotizador*).
- **Buscador Predictivo de Clientes tipo ERP**: Barra de búsqueda con lista desplegable integrada (dropdown con badges e iniciales), idéntico al estándar de sistemas gubernamentales.
- Selección rápida de clientes registrados con autocompletado de Razón Social y teléfono.
- Cotización en ventanilla y métricas comerciales en perfil (*Cotizaciones emitidas*, *Consultas OEM*, *Precisión de Stock*).

### 📦 5. Módulo para Almacenero (Despacho & Kardex)
- **Control de Despachos**: Visualización de pedidos emitidos con contadores operativos (*Por Entregar*, *Despachados*, *Total Órdenes*).
- Botón de acción **`[ ✔ Marcar Entregado ]`** con actualización de estado en tiempo real.
- **Inventario Físico & Kardex**: Asignación de ubicación por anaqueles en la sede de SMP.
- Alerta visual para repuestos con stock crítico (≤ 3 unidades).
- Controles interactivos de ajuste de stock (`+` / `-`) para ingresos por Guía de Remisión o salidas.

---

## 👥 Cuentas Maestras y Credenciales de Prueba

Para facilitar las pruebas de evaluación del proyecto, el sistema incluye **3 cuentas maestras predeterminadas** con acceso directo desde los botones demo del Login. Estas cuentas se inicializan automáticamente al clonar y ejecutar el repositorio:

| Rol | Usuario (`username`) | Correo Corporativo (`email`) | Contraseña Segura | Sede Asignada |
| :--- | :--- | :--- | :---: | :--- |
| 👤 **1. Cliente** | `carlos_mendoza` | `carlos_mendoza.cliente@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| 💼 **2. Asesor de Ventas** | `edu_morales` | `edu_morales.ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| 📦 **3. Almacenero** | `raul_quispe` | `raul_quispe.almacen@huriosrally.com` | `Hurios@2026` | Almacén Central / Despacho SMP |

> 🔒 **Política de Seguridad Implementada (Regex):**
> Todas las contraseñas exigen como mínimo **8 caracteres**, al menos 1 letra mayúscula, 1 minúscula, 1 número y 1 carácter especial (por ejemplo: `@`, `$`, `#`).
>
> 💾 **Nota de Persistencia y Aislamiento:**
> Los usuarios creados durante la ejecución se guardan de forma local en el dispositivo del evaluador a través de `AsyncStorage`. Cada usuario cuenta con su propio carrito y favoritos aislados. Para un banco de datos completo de usuarios de prueba para nuevos evaluadores, consultar [docs/pruebas_usuarios.md](docs/pruebas_usuarios.md).

---

## 🏗️ Arquitectura del Repositorio

```text
hurios-rally-app/
├── assets/                  # Iconos, splash screen y recursos gráficos
├── server/                  # Microservicio Node.js Express para envío SMTP
│   ├── package.json
│   └── server.js
├── src/
│   ├── components/          # Componentes reutilizables (Card, SearchBar, Pills)
│   ├── context/             # Estado global (CartContext)
│   ├── data/                # Data mock de repuestos automotrices
│   ├── navigation/          # React Navigation (Stack y BottomTabs adaptables)
│   ├── screens/             # Vistas de Cliente, Asesor y Almacenero
│   ├── services/            # Servicios (Auth, Storage, Camera)
│   ├── theme/               # Paleta de colores corporativos
│   └── types/               # Modelos e interfaces TypeScript
├── App.tsx                  # Entrada principal y providers
├── app.json                 # Configuración de Expo SDK
└── package.json             # Dependencias del proyecto móvil
```

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React Native / Expo (SDK 51)
- **Lenguaje:** TypeScript
- **Navegación:** React Navigation (Native Stack + Bottom Tabs)
- **Iconografía:** Expo Vector Icons (Ionicons)
- **Persistencia:** `@react-native-async-storage/async-storage`
- **Multimedia:** Expo Image Picker & Camera
- **Backend SMTP:** Node.js, Express, Nodemailer

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn
- Expo Go instalado en tu dispositivo móvil (o emulador Android/iOS)

### 1. Clonar el repositorio
```bash
git clone https://github.com/EduMoralesCar/HuriosRally-App.git
cd HuriosRally-App
```

### 2. Instalar dependencias de la app móvil
```bash
npm install
```

### 3. Iniciar la aplicación Expo
```bash
npx expo start -c
```
Escanea el código QR desde la app **Expo Go** en tu dispositivo físico o presiona `a` para emulador Android.

### 4. (Opcional) Iniciar el microservicio de correos
```bash
cd server
npm install
node server.js
```

---

## 🌿 Estrategia de Ramas (GitFlow)

- **`main`**: Rama de producción con releases estables y definitivos.
- **`dev`**: Rama de integración continua donde convergen las características probadas.
- **`feature/*`**: Ramas atómicas desarrolladas por módulo funcional (Auth, Catálogo, Pasarela de Pago, Asesor y Almacén).

---

<div align="center">
  <p>© 2026 <b>HURIOS RALLY E.I.R.L.</b> — Todos los derechos reservados.</p>
</div>
