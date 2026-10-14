# 🧪 Guía de Pruebas de Usuarios y Validación de Datos

Este documento sirve como guía para docentes, evaluadores o desarrolladores que clonen el repositorio y deseen realizar pruebas de registro, inicio de sesión, cambio de contraseñas con Regex y navegación por roles en **Hurios Rally App**.

---

## 📌 1. Cuentas Maestras Semilla (Precargadas)

Estas tres cuentas vienen inicializadas directamente en la aplicación a través de `StorageService.ts`. No requieren registro previo:

| # | Rol | Nombre Completo | Usuario | Correo Electrónico | Contraseña | Sede |
|---|:---|:---|:---|:---|:---:|:---|
| 1 | **Cliente** | Carlos Mendoza Silva | `carlos_mendoza` | `carlos_mendoza.cliente@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| 2 | **Asesor** | Edu Morales Carlos | `edu_morales` | `edu_morales.ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| 3 | **Almacenero** | Raúl Quispe Huamán | `raul_quispe` | `raul_quispe.almacen@huriosrally.com` | `Hurios@2026` | Almacén Central / Despacho SMP |

---

## 🆕 2. Banco de Datos para Pruebas de Nuevos Registros

Como la persistencia se gestiona en el almacenamiento local del dispositivo (`AsyncStorage`), cuando otra persona clona el proyecto puede registrar nuevos usuarios utilizando este banco de datos de prueba predefinido:

### 👤 Usuario de Prueba 1: Cliente Particular
- **Nombre Completo:** `Jorge Luis Ramos Vega`
- **Teléfono:** `984 123 789`
- **Rol:** `Cliente`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `jorge_ramos`
- **Correo Autogenerado:** `jorge_ramos.cliente@huriosrally.com`
- **Contraseña Sugerida:** `Ramos@2026`

### 🏢 Usuario de Prueba 2: Cliente Corporativo (Taller Mecánico)
- **Nombre Completo:** `Autoservicios & Frenos Norte S.A.C.`
- **Teléfono:** `992 554 112`
- **Rol:** `Cliente`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `autoservicios_frenos`
- **Correo Autogenerado:** `autoservicios_frenos.cliente@huriosrally.com`
- **Contraseña Sugerida:** `Taller#2026`

### 💼 Usuario de Prueba 3: Asesor Comercial de Ventas
- **Nombre Completo:** `Mariana Castro Solís`
- **Teléfono:** `971 882 334`
- **Rol:** `Asesor`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `mariana_castro`
- **Correo Autogenerado:** `mariana_castro.ventas@huriosrally.com`
- **Contraseña Sugerida:** `Ventas$2026`

### 📦 Usuario de Prueba 4: Auxiliar de Almacén y Despacho
- **Nombre Completo:** `Víctor Hugo Palacios`
- **Teléfono:** `955 641 200`
- **Rol:** `Almacenero`
- **Sede:** `Almacén Central / Despacho SMP`
- **Usuario Autogenerado:** `victor_palacios`
- **Correo Autogenerado:** `victor_palacios.almacen@huriosrally.com`
- **Contraseña Sugerida:** `Kardex!2026`

### 💼 Usuario de Prueba 5: Asesor de Repuestos Automotrices
- **Nombre Completo:** `Andrés Felipe Carranza`
- **Teléfono:** `944 312 990`
- **Rol:** `Asesor`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `andres_carranza`
- **Correo Autogenerado:** `andres_carranza.ventas@huriosrally.com`
- **Contraseña Sugerida:** `Rally*2026`

---

## 🔒 3. Casos de Prueba para Validación de Contraseñas (Regex)

El sistema evalúa las contraseñas mediante **expresiones regulares estrictas**:
- Longitud mínima de **8 caracteres**.
- Al menos una letra **mayúscula** (`[A-Z]`).
- Al menos una letra **minúscula** (`[a-z]`).
- Al menos un **número** (`[0-9]`).
- Al menos un **carácter especial** (`[!@#$%^&*(),.?":{}|<>_\-]`).

### ❌ Contraseñas que deben ser RECHAZADAS (Casos Inválidos):
| Contraseña Ingresada | Motivo del Rechazo | Mensaje en la App |
| :--- | :--- | :--- |
| `123456` | Menor a 8 caracteres, sin letras ni símbolos | *La contraseña debe tener como mínimo 8 caracteres.* |
| `huriosrally` | Sin mayúscula, sin números, sin símbolos | *La contraseña debe contener al menos una letra mayúscula (A-Z).* |
| `HURIOSRALLY` | Sin minúscula, sin números, sin símbolos | *La contraseña debe contener al menos una letra minúscula (a-z).* |
| `HuriosRally` | Sin números, sin símbolos | *La contraseña debe contener al menos un número (0-9).* |
| `Hurios2026` | Sin carácter especial | *La contraseña debe contener al menos un carácter especial (@, $, #, etc.).* |

### ✔️ Contraseñas que deben ser ACEPTADAS (Casos Válidos):
- `Hurios@2026` *(Cumple con longitud 11, mayúscula, minúscula, número y símbolo `@`)*
- `Rally#2026` *(Cumple con longitud 10, mayúscula, minúscula, número y símbolo `#`)*
- `Motor$8899` *(Cumple con longitud 10, mayúscula, minúscula, número y símbolo `$`)*
- `Frenos_2026` *(Cumple con longitud 11, mayúscula, minúscula, número y símbolo `_`)*
- `Almacen!123` *(Cumple con longitud 11, mayúscula, minúscula, número y símbolo `!`)*

---

## 🛒 4. Prueba de Aislamiento de Carrito y Favoritos por Usuario

1. Iniciar sesión con **Cliente** (`carlos_mendoza`).
2. Agregar 2 repuestos al carrito (ej. Pastillas de Freno y Disco Ventilado) y marcar un producto como Favorito.
3. Ir al Perfil y presionar **Cerrar Sesión**.
4. Iniciar sesión con **Asesor** (`edu_morales`) o crear un usuario nuevo.
5. **Resultado esperado:** El carrito de compras del nuevo usuario estará en **0 productos (vacío)** y sus favoritos estarán limpios, confirmando que la persistencia se encuentra segmentada individualmente en `AsyncStorage`.
