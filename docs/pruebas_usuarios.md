# Guía de Pruebas de Usuarios y Validación de Datos

Este documento técnico sirve como protocolo de pruebas para evaluadores, docentes y desarrolladores que requieran verificar el flujo de autenticación con firma SHA-256, la aplicación de directivas Regex para contraseñas, la edición de datos tributarios (`DNI` / `RUC`), el aislamiento de pre-órdenes y la segregación de permisos por roles en **Hurios Rally App**.

---

## 1. Cuentas Maestras del Sistema

Estas cuentas se encuentran precargadas y sincronizadas en el almacenamiento persistente (`AsyncStorage`) a través de [`StorageService.ts`](file:///d:/Workspace/utp/hurios-rally-app/src/services/StorageService.ts). Las tres primeras pueden cargarse con un solo toque desde los botones de acceso rápido de la pantalla de inicio de sesión:

| N° | Rol del Sistema | Nombre Completo | Nombre de Usuario | Correo Electrónico Corporativo | Contraseña Segura | Sede Operativa Asignada |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | **Cliente** | Carlos Mendoza Silva | `carlos_mendoza` | `carlos_mendoza.cliente@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **2** | **Asesor** | Edu Morales Carlos | `edu_morales` | `edu_morales.ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **3** | **Administrador** | Raúl Quispe Huamán | `raul_quispe` | `raul_quispe.almacen@huriosrally.com` | `Hurios@2026` | Almacén Central / Despacho SMP |
| **4** | **Administrador** | Edu Morales | `admin_rally` | `ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |

---

## 2. Banco de Datos para Pruebas de Nuevos Registros

Dado que la persistencia se gestiona en el almacenamiento local del dispositivo mediante `AsyncStorage`, los evaluadores pueden registrar nuevas cuentas utilizando el siguiente banco de datos estandarizado:

### 2.1. Usuario de Prueba 1: Cliente Particular
- **Nombre Completo:** `Jorge Luis Ramos Vega`
- **Teléfono:** `984123789`
- **Rol:** `Cliente`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `jorge_ramos`
- **Correo Autogenerado:** `jorge_ramos.cliente@huriosrally.com`
- **Contraseña Sugerida:** `Ramos@2026`

### 2.2. Usuario de Prueba 2: Cliente Corporativo (Taller Mecánico)
- **Nombre Completo:** `Autoservicios & Frenos Norte S.A.C.`
- **Teléfono:** `992554112`
- **Rol:** `Cliente`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `autoservicios_frenos`
- **Correo Autogenerado:** `autoservicios_frenos.cliente@huriosrally.com`
- **Contraseña Sugerida:** `Taller#2026`

### 2.3. Usuario de Prueba 3: Asesor Comercial de Ventas
- **Nombre Completo:** `Mariana Castro Solís`
- **Teléfono:** `971882334`
- **Rol:** `Asesor`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `mariana_castro`
- **Correo Autogenerado:** `mariana_castro.ventas@huriosrally.com`
- **Contraseña Sugerida:** `Ventas$2026`

### 2.4. Usuario de Prueba 4: Administrador de Operaciones y Kardex
- **Nombre Completo:** `Víctor Hugo Palacios`
- **Teléfono:** `955641200`
- **Rol:** `Administrador`
- **Sede:** `Almacén Central / Despacho SMP`
- **Usuario Autogenerado:** `victor_palacios`
- **Correo Autogenerado:** `victor_palacios.almacen@huriosrally.com`
- **Contraseña Sugerida:** `Kardex!2026`

### 2.5. Usuario de Prueba 5: Asesor de Repuestos Automotrices
- **Nombre Completo:** `Andrés Felipe Carranza`
- **Teléfono:** `944312990`
- **Rol:** `Asesor`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `andres_carranza`
- **Correo Autogenerado:** `andres_carranza.ventas@huriosrally.com`
- **Contraseña Sugerida:** `Rally*2026`

---

## 3. Casos de Prueba para Validación de Contraseñas (Regex)

El sistema evalúa las contraseñas en inicio de sesión, registro, recuperación OTP y cambio de clave mediante **expresiones regulares estrictas** y permite alternar la visibilidad del texto mediante el ícono de vista (`eye-outline`):
- Longitud mínima de **8 caracteres**.
- Al menos una letra **mayúscula** (`[A-Z]`).
- Al menos una letra **minúscula** (`[a-z]`).
- Al menos un **número** (`[0-9]`).
- Al menos un **carácter especial** (`[!@#$%^&*(),.?":{}|<>_\-]`).

### 3.1. Casos de Prueba Inválidos (Rechazados por Política Regex)
| Contraseña Ingresada | Motivo del Rechazo | Mensaje Desplegado en la App |
| :--- | :--- | :--- |
| `123456` | Longitud menor a 8 caracteres, sin letras ni símbolos | *La contraseña debe tener como mínimo 8 caracteres.* |
| `huriosrally` | Sin mayúscula, sin números, sin caracteres especiales | *La contraseña debe contener al menos una letra mayúscula (A-Z).* |
| `HURIOSRALLY` | Sin minúscula, sin números, sin caracteres especiales | *La contraseña debe contener al menos una letra minúscula (a-z).* |
| `HuriosRally` | Sin números, sin caracteres especiales | *La contraseña debe contener al menos un número (0-9).* |
| `Hurios2026` | Sin carácter especial | *La contraseña debe contener al menos un carácter especial (@, $, #, etc.).* |

### 3.2. Casos de Prueba Válidos (Aprobados por el Validador)
- `Hurios@2026` *(Cumple con longitud 11, mayúscula, minúscula, número y símbolo `@`)*
- `Rally#2026` *(Cumple con longitud 10, mayúscula, minúscula, número y símbolo `#`)*
- `Motor$8899` *(Cumple con longitud 10, mayúscula, minúscula, número y símbolo `$`)*
- `Frenos_2026` *(Cumple con longitud 11, mayúscula, minúscula, número y símbolo `_`)*
- `Almacen!123` *(Cumple con longitud 11, mayúscula, minúscula, número y símbolo `!`)*

---

## 4. Protocolo de Verificación por Rol y Aislamiento de Datos

### 4.1. Verificación del Rol Cliente (`carlos_mendoza`)
1. Iniciar sesión con `carlos_mendoza` (`Hurios@2026`).
2. Agregar repuestos a la pre-orden y marcar un producto en **Favoritos**.
3. Abrir la pestaña **Perfil** y pulsar el botón **Editar**:
   - Verificar que el teléfono muestre los 9 dígitos completos (`987111222`).
   - Verificar que estén disponibles los campos exclusivos de **DNI (8 dígitos) / RUC (11 dígitos)** y **Dirección de Entrega**.
   - Confirmar que no aparezcan opciones de administración de usuarios ni bitácora del sistema.

### 4.2. Verificación del Rol Asesor (`edu_morales`)
1. Cerrar sesión e ingresar con `edu_morales` (`Hurios@2026`).
2. Verificar que la pre-orden inicie en **0 productos**, comprobando el aislamiento por usuario (`@hurios_cart_{userId}`).
3. Abrir el menú lateral o la pestaña **Rotación** para acceder a **Repuestos de Alta Rotación** y agregar piezas directamente al mostrador.
4. Acceder a **Reportes** para consultar estadísticas de ventas y el mantenimiento de catálogo.

### 4.3. Verificación del Rol Administrador (`raul_quispe`)
1. Cerrar sesión e ingresar con `raul_quispe` (`Hurios@2026`).
2. Verificar las pestañas operativas de **Kardex**, **Despacho**, **Reportes**, **Catálogo** y **Perfil**.
3. En **Perfil**, abrir **Gestión de Usuarios** para cambiar roles (`Cliente`, `Asesor`, `Administrador`), dar de baja o restaurar cuentas, y consultar el **Registro de Actividad**.
