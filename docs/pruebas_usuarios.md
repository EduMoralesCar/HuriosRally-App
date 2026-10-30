# Guía de Pruebas de Usuarios y Validación de Datos

Este documento técnico sirve como protocolo de pruebas para evaluadores, docentes y desarrolladores que requieran verificar el flujo de autenticación, la aplicación de directivas Regex para contraseñas, el aislamiento de pre-órdenes y la segregación por roles en **Hurios Rally App**.

---

## 1. Cuentas Maestras del Sistema

Estas tres cuentas se encuentran precargadas en el almacenamiento persistente (`AsyncStorage`) a través de `StorageService.ts`. Pueden utilizarse de inmediato o cargarse con un solo toque desde los botones de acceso rápido de la pantalla de inicio de sesión:

| N° | Rol del Sistema | Nombre Completo | Nombre de Usuario | Correo Electrónico Corporativo | Contraseña Segura | Sede Operativa Asignada |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | **Cliente** | Carlos Mendoza Silva | `carlos_mendoza` | `carlos_mendoza.cliente@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **2** | **Asesor** | Edu Morales Carlos | `edu_morales` | `edu_morales.ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **3** | **Almacenero** | Raúl Quispe Huamán | `raul_quispe` | `raul_quispe.almacen@huriosrally.com` | `Hurios@2026` | Almacén Central / Despacho SMP |

---

## 2. Banco de Datos para Pruebas de Nuevos Registros

Dado que la persistencia se gestiona en el almacenamiento local del dispositivo mediante `AsyncStorage`, los evaluadores pueden registrar nuevas cuentas utilizando el siguiente banco de datos estandarizado:

### 2.1. Usuario de Prueba 1: Cliente Particular
- **Nombre Completo:** `Jorge Luis Ramos Vega`
- **Teléfono:** `984 123 789`
- **Rol:** `Cliente`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `jorge_ramos`
- **Correo Autogenerado:** `jorge_ramos.cliente@huriosrally.com`
- **Contraseña Sugerida:** `Ramos@2026`

### 2.2. Usuario de Prueba 2: Cliente Corporativo (Taller Mecánico)
- **Nombre Completo:** `Autoservicios & Frenos Norte S.A.C.`
- **Teléfono:** `992 554 112`
- **Rol:** `Cliente`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `autoservicios_frenos`
- **Correo Autogenerado:** `autoservicios_frenos.cliente@huriosrally.com`
- **Contraseña Sugerida:** `Taller#2026`

### 2.3. Usuario de Prueba 3: Asesor Comercial de Ventas
- **Nombre Completo:** `Mariana Castro Solís`
- **Teléfono:** `971 882 334`
- **Rol:** `Asesor`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `mariana_castro`
- **Correo Autogenerado:** `mariana_castro.ventas@huriosrally.com`
- **Contraseña Sugerida:** `Ventas$2026`

### 2.4. Usuario de Prueba 4: Auxiliar de Almacén y Despacho
- **Nombre Completo:** `Víctor Hugo Palacios`
- **Teléfono:** `955 641 200`
- **Rol:** `Almacenero`
- **Sede:** `Almacén Central / Despacho SMP`
- **Usuario Autogenerado:** `victor_palacios`
- **Correo Autogenerado:** `victor_palacios.almacen@huriosrally.com`
- **Contraseña Sugerida:** `Kardex!2026`

### 2.5. Usuario de Prueba 5: Asesor de Repuestos Automotrices
- **Nombre Completo:** `Andrés Felipe Carranza`
- **Teléfono:** `944 312 990`
- **Rol:** `Asesor`
- **Sede:** `Lima Norte / SMP (Sede Central)`
- **Usuario Autogenerado:** `andres_carranza`
- **Correo Autogenerado:** `andres_carranza.ventas@huriosrally.com`
- **Contraseña Sugerida:** `Rally*2026`

---

## 3. Casos de Prueba para Validación de Contraseñas (Regex)

El sistema evalúa las contraseñas mediante **expresiones regulares estrictas**:
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

## 4. Protocolo de Verificación de Aislamiento de Carrito y Favoritos

1. Iniciar sesión con el usuario de rol **Cliente** (`carlos_mendoza`).
2. Agregar 2 repuestos al carrito (por ejemplo, *Pastillas de Freno* y *Disco Ventilado*) y marcar un producto como favorito.
3. Dirigirse a la pestaña de **Perfil** y presionar el botón **Cerrar Sesión**.
4. Iniciar sesión con el usuario de rol **Asesor** (`edu_morales`) o crear un usuario nuevo.
5. **Resultado Esperado de la Prueba:**  
   El carrito de compras del nuevo usuario se presentará con **0 productos (vacío)** y su lista de favoritos no contendrá los elementos del usuario anterior, confirmando que las claves de almacenamiento en `AsyncStorage` se encuentran aisladas por el identificador de usuario (`@hurios_cart_{userId}`).
