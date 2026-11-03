# Sistema Móvil de Comercio, Cotización ERP y Administración Logística

[![React Native](https://img.shields.io/badge/React_Native-0.88.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-58.0.22-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![React](https://img.shields.io/badge/React-19.3.0-087EA4?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0_Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Layered-orange?style=flat-square)](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)
[![Standard](https://img.shields.io/badge/Standard-IEEE%20830%20%2F%20ISO%2025010-blue?style=flat-square)](https://www.iso.org/standard/35733.html)

**Entidad Titular:** HURIOS RALLY E.I.R.L.  
**RUC:** 20608542191  
**Ubicación:** Av. Perú 2450, San Martín de Porres, Lima Norte  
**Plataforma de Ejecución:** Android / iOS (Motor React Native sobre Expo Go SDK 58)  

---

## Índice General

1. [Introducción y Descripción del Sistema](#1-introducción-y-descripción-del-sistema)
2. [Especificación de Requisitos y Alcance Funcional](#2-especificación-de-requisitos-y-alcance-funcional)
3. [Diagramas de Ingeniería de Software (UML & Arquitectura)](#3-diagramas-de-ingeniería-de-software-uml--arquitectura)
   - [3.1. Diagrama de Casos de Uso del Sistema](#31-diagrama-de-casos-de-uso-del-sistema)
   - [3.2. Diagrama de Arquitectura de Capas y Componentes](#32-diagrama-de-arquitectura-de-capas-y-componentes)
   - [3.3. Diagrama de Secuencia: Proceso de Cotización, Checkout y Registro de Pedido](#33-diagrama-de-secuencia-proceso-de-cotización-checkout-y-registro-de-pedido)
   - [3.4. Diagrama de Secuencia: Autenticación Criptográfica SHA-256 y Recuperación SMTP](#34-diagrama-de-secuencia-autenticación-criptográfica-sha-256-y-recuperación-smtp)
   - [3.5. Diagrama de Clases del Dominio](#35-diagrama-de-clases-del-dominio)
   - [3.6. Diagrama de Entidad - Relación de Persistencia](#36-diagrama-de-entidad---relación-de-persistencia)
   - [3.7. Diagrama de Máquina de Estados del Pedido y Ciclo de Despacho](#37-diagrama-de-máquina-de-estados-del-pedido-y-ciclo-de-despacho)
   - [3.8. Diagrama de Estados de Sesión y Control de Acceso basado en Roles (RBAC)](#38-diagrama-de-estados-de-sesión-y-control-de-acceso-basado-en-roles-rbac)
   - [3.9. Diagrama de Actividades: Flujo del Control de Inventario y Kardex](#39-diagrama-de-actividades-flujo-del-control-de-inventario-y-kardex)
4. [Matriz de Roles y Control de Acceso (RBAC)](#4-matriz-de-roles-y-control-de-acceso-rbac)
5. [Cuentas Maestras del Sistema y Credenciales de Evaluación](#5-cuentas-maestras-del-sistema-y-credenciales-de-evaluación)
6. [Pila Tecnológica y Dependencias](#6-pila-tecnológica-y-dependencias)
7. [Estructura y Organización del Código Fuente](#7-estructura-y-organización-del-código-fuente)
8. [Guía de Instalación, Configuración y Despliegue](#8-guía-de-instalación-configuración-y-despliegue)
9. [Ciclo de Vida del Software y Control de Versiones](#9-ciclo-de-vida-del-software-y-control-de-versiones)
10. [Información Institucional y Licencia](#10-información-institucional-y-licencia)

---

## 1. Introducción y Descripción del Sistema

**Hurios Rally App** es una solución de software móvil multiplataforma desarrollada bajo principios de Ingeniería de Software para responder a las exigencias operativas, comerciales y administrativas de **HURIOS RALLY E.I.R.L.**, empresa importadora y distribuidora de repuestos de alto rendimiento automotriz con sede principal en San Martín de Porres (Lima, Perú).

El sistema consolida en una sola aplicación reactiva los tres perfiles operativos de la organización:
1. **Comercio Minorista Digital (Modo Cliente):** Catálogo técnico clasificado por códigos OEM y familias automotrices, lista de favoritos, gestión de datos de facturación personal (`DNI` / `RUC` y dirección de entrega), cotización en tiempo real y pasarela de pago multimodal.
2. **Atención en Mostrador y Alta Rotación (Modo Asesor / ERP):** Interfaz comercial para emisión de proformas presenciales con búsqueda predictiva de clientes registrados, acceso directo a repuestos de alta rotación, selección de comprobante (Boleta / Factura con validación RUC) y consulta de métricas comerciales.
3. **Administración General, Logística y Kardex (Modo Administrador):** Control integral del negocio que centraliza el monitoreo físico de anaqueles por lote, atención y despacho de órdenes confirmadas, reportes estadísticos y financieros, mantenimiento CRUD del catálogo OEM y administración de cuentas, roles y bitácora de actividad.

---

## 2. Especificación de Requisitos y Alcance Funcional

| Módulo | Requisito Funcional | Descripción Técnica |
| :--- | :--- | :--- |
| **RF-01** | Autenticación Criptográfica | Inicio de sesión con firma SHA-256 + salt institucional, codificación UTF-8 nativa compatible con el motor Hermes, validación Regex y control de visibilidad de contraseña. |
| **RF-02** | Registro Inteligente | Generación algorítmica de credenciales corporativas (`nombre_apellido` y dominio según rol) con asignación de avatar clásico por defecto. |
| **RF-03** | Recuperación OTP | Despacho de código de seguridad de 6 dígitos mediante microservicio SMTP con control de expiración y debounce anti-duplicados. |
| **RF-04** | Catálogo Técnico y CRUD | 46 piezas OEM base en 5 categorías (*Frenos, Suspensión, Motor, Filtros, Accesorios*) con búsqueda debounced (180 ms) y módulo CRUD persistente de repuestos. |
| **RF-05** | Inspección Visual | Captura de imagen mediante cámara del dispositivo o selección desde galería para asociar fotografías reales a lotes y perfiles. |
| **RF-06** | Pre-orden & Carrito Aislado | Contexto global (`CartContext`) con cálculo automático de Subtotal, IGV (18%) y totalización aislada por identificador de usuario. |
| **RF-07** | Favoritos y Alta Rotación | Vista dual (`SavedFavoritesScreen`) que gestiona la lista de deseos para el rol `Cliente` y el catálogo de repuestos de alta rotación para el rol `Asesor`. |
| **RF-08** | Pasarela Multimodal | Soporte para Yape/Plin (registro de operación), Tarjeta Débito/Crédito (validación 16 dígitos y CVV) y Pago en Mostrador / Contraentrega. |
| **RF-09** | ERP de Mostrador | Selector predictivo de clientes registrados con autocompletado de nombre/razón social, documento tributario y teléfono de contacto. |
| **RF-10** | Kardex en Tiempo Real | Sincronización bidireccional de anaqueles, ajuste manual de conteo físico y alerta preventiva de stock crítico (≤ 3 unidades). |
| **RF-11** | Control de Despacho | Filtrado de órdenes (*Pendientes, Despachados, Todos*) con acción de confirmación de entrega física en tienda. |
| **RF-12** | Reportes y Estadísticas | Panel analítico (`ReportsScreen`) con recaudación total, ticket promedio, distribución por método de pago, filtros multicriterio y ranking de repuestos. |
| **RF-13** | Administración de Usuarios | Gestión exclusiva del `Administrador` para asignar roles RBAC, dar de baja, reactivar cuentas y restaurar los usuarios maestros del sistema. |
| **RF-14** | Perfil Tributario de Cliente | Edición exclusiva para `Cliente` de número telefónico validado a 9 dígitos, documento `DNI` (8 dígitos) o `RUC` (11 dígitos) y dirección de despacho. |

---

## 3. Diagramas de Ingeniería de Software (UML & Arquitectura)

### 3.1. Diagrama de Casos de Uso del Sistema

Representa las interacciones entre los tres actores primarios del sistema (**Cliente**, **Asesor** y **Administrador**) y los casos de uso que cubren la operación comercial, logística y administrativa.

```mermaid
flowchart LR
  subgraph Actores["Actores del Sistema"]
    A1["Actor: Cliente"]
    A2["Actor: Asesor Comercial"]
    A3["Actor: Administrador"]
    A4["Servicio Externo: Servidor SMTP Node.js"]
  end

  subgraph CasosDeUso["Casos de Uso Principales - Hurios Rally App"]
    UC01["UC01: Autenticacion SHA-256 con Validacion Regex"]
    UC02["UC02: Recuperacion de Clave con Codigo OTP"]
    UC03["UC03: Registro Inteligente de Usuario"]
    UC04["UC04: Explorar Catalogo por Familia Tecnica"]
    UC05["UC05: Inspeccionar Repuesto con Camara / Galeria"]
    UC06["UC06: Gestionar Pre-orden y Carrito Aislado"]
    UC07["UC07: Procesar Checkout Multimodal (Yape / Tarjeta / Mostrador)"]
    UC08["UC08: Busqueda Predictiva ERP y Alta Rotacion"]
    UC09["UC09: Emitir Comprobante (Boleta / Factura RUC)"]
    UC10["UC10: Administrar Kardex y Ajuste Fisico de Anaqueles"]
    UC11["UC11: Atender y Confirmar Despacho de Pedidos"]
    UC12["UC12: Editar Perfil, DNI/RUC y Cambio de Clave"]
    UC13["UC13: Consultar Reportes, Filtros y CRUD de Catalogo"]
    UC14["UC14: Administrar Usuarios, Roles RBAC y Bitacora"]
  end

  A1 --> UC01
  A1 --> UC02
  A1 --> UC03
  A1 --> UC04
  A1 --> UC05
  A1 --> UC06
  A1 --> UC07
  A1 --> UC12

  A2 --> UC01
  A2 --> UC04
  A2 --> UC06
  A2 --> UC07
  A2 --> UC08
  A2 --> UC09
  A2 --> UC12
  A2 --> UC13

  A3 --> UC01
  A3 --> UC04
  A3 --> UC10
  A3 --> UC11
  A3 --> UC12
  A3 --> UC13
  A3 --> UC14

  UC02 -.-> A4
```

---

### 3.2. Diagrama de Arquitectura de Capas y Componentes

Ilustra la separación de responsabilidades bajo una arquitectura en capas desacoplada sobre **Expo SDK 58**, donde la vista móvil consume servicios independientes de seguridad, autenticación y persistencia.

```mermaid
flowchart TD
  subgraph CapaPresentacion["Capa de Presentacion (React Native 0.88 / Expo SDK 58)"]
    NavStack["AppNavigator & BottomTabNavigator (Enrutamiento Dinamico por Rol)"]
    subgraph Vistas["Pantallas (Screens)"]
      S_Login["LoginScreen"]
      S_Catalog["CatalogScreen"]
      S_Categories["CategoriesScreen"]
      S_Detail["DetailScreen"]
      S_SavedFav["SavedFavoritesScreen (Favoritos / Alta Rotacion)"]
      S_Favorites["FavoritesScreen (Checkout & Mostrador)"]
      S_Reports["ReportsScreen (Estadisticas, Filtros & CRUD)"]
      S_Stock["WarehouseStockScreen (Kardex)"]
      S_Dispatch["WarehouseDispatchScreen (Despacho)"]
      S_Profile["ProfileScreen (Perfil, DNI/RUC & Admin Usuarios)"]
    end
    subgraph ComponentesUI["Componentes Reutilizables"]
      C_Img["ProductImage (Fallback Resiliente)"]
      C_Card["CardRepuesto"]
      C_Search["SearchBar"]
      C_Pills["CategoryPills"]
    end
  end

  subgraph CapaLogica["Capa de Logica de Negocio y Estado Global"]
    Ctx_Cart["CartContext (Pre-orden, Subtotal e IGV 18%)"]
    Hook_Debounce["useDebouncedValue (Hook 180ms)"]
    subgraph Utilitarios["Modulos Utilitarios"]
      U_Val["validators.ts (Regex Claves, Tarjetas, RUC)"]
      U_Cat["catalog.ts (Stock, Filtros, Normalizacion)"]
      U_Ord["orders.ts (Correlativos PED-XXXX, Resumenes)"]
    end
  end

  subgraph CapaServicios["Capa de Servicios de Integracion y Seguridad"]
    Srv_Auth["AuthService (Control RBAC, Login y OTP)"]
    Srv_Sec["SecurityService (SHA-256 UTF-8, Tokens y Permisos)"]
    Srv_Storage["StorageService (Persistencia Aislada y CRUD)"]
    Srv_Camera["CameraService (Sensores de Camara y Galeria)"]
  end

  subgraph CapaPersistencia["Capa de Persistencia y Backend"]
    DB_Async["AsyncStorage (Almacenamiento Local en Dispositivo)"]
    Srv_SMTP["Microservicio Node.js Express (SMTP Nodemailer Port 3000)"]
  end

  NavStack --> Vistas
  Vistas --> ComponentesUI
  Vistas --> Ctx_Cart
  Vistas --> Hook_Debounce
  Vistas --> Utilitarios
  Vistas --> CapaServicios

  Ctx_Cart --> Srv_Storage
  Srv_Auth --> Srv_Sec
  Srv_Auth --> Srv_Storage
  Srv_Auth --> Srv_SMTP
  Srv_Storage --> Srv_Sec
  Srv_Storage --> DB_Async
```

---

### 3.3. Diagrama de Secuencia: Proceso de Cotización, Checkout y Registro de Pedido

Detalla las invocaciones sincronizadas y asíncronas para validar los datos financieros, descontar stock en Kardex y persistir el pedido en el historial.

```mermaid
sequenceDiagram
  autonumber
  actor Usuario as "Cliente / Asesor"
  participant UI as "FavoritesScreen (UI)"
  participant Val as "validators.ts"
  participant Ord as "orders.ts"
  participant Storage as "StorageService"
  participant DB as "AsyncStorage"
  participant Cart as "CartContext"

  Usuario->>UI: Presiona "Continuar al Pago"
  UI->>UI: Despliega modal de checkout interactivo
  Usuario->>UI: Selecciona metodo (Yape/Tarjeta/Efectivo) e ingresa datos
  Usuario->>UI: Presiona "Confirmar y Procesar Pago"

  UI->>Val: validarCheckout(formulario)
  alt Formulario contiene errores
    Val-->>UI: Retorna mapa de errores de validacion
    UI-->>Usuario: Muestra mensajes de advertencia en campos
  else Formulario valido (0 errores)
    Val-->>UI: Retorna objeto vacio (Valido)
    UI->>Storage: getHistorialPedidos()
    Storage->>DB: Leer "@hurios_historial_pedidos"
    DB-->>Storage: Retorna lista de pedidos existentes
    Storage-->>UI: Pedidos previos registrados

    UI->>Ord: generarCodigoPedido(existentes)
    Ord-->>UI: Retorna correlativo oficial (Ej. "PED-0006")

    UI->>Storage: savePedidoEnHistorial(nuevoPedido)
    Storage->>DB: Escribir pedido con estado "Pagado" o "Confirmado"
    DB-->>Storage: Confirmacion de escritura

    UI->>Cart: clearCart()
    Cart->>DB: Vaciar items del carrito para el usuario activo
    DB-->>Cart: Carrito sincronizado en cero

    UI-->>Usuario: Despliega Modal de Exito con N° de Pedido y resumen
  end
```

---

### 3.4. Diagrama de Secuencia: Autenticación Criptográfica SHA-256 y Recuperación SMTP

Describe el ciclo de vida del inicio de sesión mediante firma SHA-256, generación de token cifrado de sesión y recuperación de clave mediante código OTP.

```mermaid
sequenceDiagram
  autonumber
  actor Usuario as "Usuario / Colaborador"
  participant Login as "LoginScreen"
  participant Auth as "AuthService"
  participant Sec as "SecurityService"
  participant Storage as "StorageService"
  participant SMTP as "Servidor Node.js (Express/Nodemailer)"

  alt Flujo 1: Inicio de Sesion Criptografico
    Usuario->>Login: Ingresa usuario/correo y contrasena
    Login->>Auth: login(identificador, password)
    Auth->>Storage: getUsuarios()
    Storage-->>Auth: Retorna usuarios registrados y sincronizados
    Auth->>Sec: verifyPassword(password, user.passwordHash, user.password)
    Sec-->>Auth: Resultado booleano de verificacion SHA-256
    alt Credenciales validas y cuenta Activa
      Auth->>Sec: createEncryptedSessionToken(userId, username, rol)
      Sec-->>Auth: Retorna sessionToken cifrado
      Auth->>Storage: saveSesion(usuarioAutenticado)
      Auth-->>Login: Retorna { success: true, user }
      Login-->>Usuario: Redirige al panel segun Rol (Cliente / Asesor / Administrador)
    else Credenciales invalidas o cuenta Inactiva
      Auth-->>Login: Retorna { success: false, message }
      Login-->>Usuario: Muestra aviso de credenciales o estado de cuenta
    end

  else Flujo 2: Recuperacion de Contrasena con Codigo OTP
    Usuario->>Login: Selecciona "Olvide mi contrasena" e ingresa correo
    Login->>Auth: sendResetCode(email)
    Auth->>Auth: Genera codigo aleatorio de 6 digitos (expira en 15 min)
    Auth->>SMTP: POST /api/send-reset-code { email, code, userName }
    SMTP-->>Auth: HTTP 200 { success: true, message: "Correo despachado" }
    Auth-->>Login: Codigo enviado exitosamente
    Login-->>Usuario: Solicita ingreso de OTP y nueva contrasena

    Usuario->>Login: Ingresa codigo OTP y nueva clave
    Login->>Auth: resetPasswordWithCode(email, code, newPass)
    Auth->>Auth: validateStrongPassword(newPass) con Regex
    alt Codigo OTP valido y clave cumple Regex
      Auth->>Sec: hashPassword(newPass)
      Sec-->>Auth: Nuevo hash SHA-256
      Auth->>Storage: saveUsuario(usuarioActualizado)
      Auth-->>Login: Retorna confirmacion de actualizacion
      Login-->>Usuario: Notifica exito y habilita inicio de sesion
    else Codigo OTP invalido o clave debil
      Auth-->>Login: Retorna error especifico de validacion
      Login-->>Usuario: Rechaza operacion e informa motivo
    end
  end
```

---

### 3.5. Diagrama de Clases del Dominio

Estructura de clases, interfaces, tipos enumerados y servicios que conforman el modelo de dominio en TypeScript estricto.

```mermaid
classDiagram
  class RolUsuario {
    <<enumeration>>
    Cliente
    Asesor
    Administrador
  }

  class CategoriaRepuesto {
    <<enumeration>>
    Frenos
    Suspension
    Motor
    Filtros
    Accesorios
  }

  class EstadoPedido {
    <<enumeration>>
    Confirmado
    Pagado
    Entregado
  }

  class Usuario {
    +string id
    +string nombreCompleto
    +string username
    +string email
    +string password
    +string passwordHash
    +RolUsuario rol
    +string sede
    +string telefono
    +string documentoIdentidad
    +string direccion
    +string fotoPerfilUri
    +boolean biometricsEnabled
    +string estadoCuenta
    +string sessionToken
  }

  class Repuesto {
    +string id
    +string codigoOEM
    +string nombre
    +string descripcion
    +number precio
    +CategoriaRepuesto categoria
    +string compatibilidad
    +number stock
    +string imagenUri
    +string fotoInspeccionUri
    +number rating
    +number numReviews
  }

  class ItemCarrito {
    +Repuesto repuesto
    +number cantidad
  }

  class PedidoLocal {
    +string id
    +ItemCarrito[] items
    +string fechaCreacion
    +number subtotal
    +number igv
    +number totalCotizado
    +EstadoPedido estado
    +string clienteId
    +string clienteNombre
    +string clienteTelefono
    +string creadoPorId
    +string creadoPorNombre
    +string metodoPago
    +string comprobanteTipo
    +string documentoNumero
    +string numOperacion
  }

  class SecurityService {
    <<utility>>
    +hashPassword(plain: string) string
    +verifyPassword(plain: string, hash: string) boolean
    +createEncryptedSessionToken(id, user, rol) string
    +validateSessionToken(token: string) SessionValidation
    +getRolePermissions(rol: RolUsuario) RolePermissionMatrix
    +hasPermission(rol: RolUsuario, perm: string) boolean
  }

  class StorageService {
    <<utility>>
    +getUsuarios() Promise~Usuario[]~
    +saveUsuario(u: Usuario) Promise~void~
    +updateRolUsuario(id: string, r: RolUsuario) Promise~Usuario~
    +cambiarEstadoCuentaUsuario(id: string, e: string) Promise~Usuario~
    +restaurarUsuariosPorDefecto() Promise~Usuario[]~
    +getCatalogoCompleto() Promise~Repuesto[]~
    +saveRepuestoCatalogo(r: Repuesto) Promise~Repuesto[]~
    +deleteRepuestoCatalogo(id: string) Promise~Repuesto[]~
    +getHistorialPedidos() Promise~PedidoLocal[]~
    +savePedidoEnHistorial(p: PedidoLocal) Promise~void~
  }

  class AuthService {
    <<utility>>
    +login(identificador, pass) Promise~AuthResult~
    +register(datos) Promise~AuthResult~
    +sendResetCode(email) Promise~AuthResult~
    +resetPasswordWithCode(email, code, newPass) Promise~AuthResult~
    +updatePassword(id, oldPass, newPass) Promise~AuthResult~
    +validateStrongPassword(pass) PasswordValidation
  }

  Usuario "1" --> "0..*" PedidoLocal : solicita o emite
  PedidoLocal "1" *-- "1..*" ItemCarrito : contiene
  ItemCarrito "1" o-- "1" Repuesto : referencia
  StorageService ..> Usuario : persiste
  StorageService ..> PedidoLocal : persiste
  StorageService ..> Repuesto : persiste
  AuthService ..> SecurityService : cifra y verifica
  AuthService ..> Usuario : autentica y autoriza
```

---

### 3.6. Diagrama de Entidad - Relación de Persistencia

Modela los almacenes clave-valor y registros normalizados que el sistema persiste de forma asíncrona en el almacenamiento interno del dispositivo.

```mermaid
erDiagram
  USUARIO ||--o{ PEDIDO : "emite / registra"
  USUARIO ||--o{ FAVORITO : "marca como favorito"
  USUARIO ||--o{ ITEM_CARRITO : "mantiene activo"
  USUARIO ||--o{ BITACORA_ACTIVIDAD : "genera evento"
  PEDIDO ||--|{ DETALLE_PEDIDO : "contiene"
  REPUESTO ||--o{ DETALLE_PEDIDO : "es referenciado en"
  REPUESTO ||--o{ FAVORITO : "es seleccionado en"
  REPUESTO ||--o{ ITEM_CARRITO : "es reservado en"
  REPUESTO ||--o| KARDEX_OVERRIDE : "registra conteo fisico"

  USUARIO {
    string id PK
    string username UK
    string email UK
    string passwordHash
    string nombreCompleto
    string rol
    string sede
    string telefono
    string documentoIdentidad
    string direccion
    string estadoCuenta
    string fotoPerfilUri
    boolean biometricsEnabled
  }

  REPUESTO {
    string id PK
    string codigoOEM UK
    string nombre
    string descripcion
    float precio
    string categoria
    string compatibilidad
    int stockBase
    string imagenUri
    string fotoInspeccionUri
    float rating
    int numReviews
  }

  PEDIDO {
    string id PK
    string fechaCreacion
    float subtotal
    float igv
    float totalCotizado
    string estado
    string clienteId FK
    string clienteNombre
    string clienteTelefono
    string creadoPorId FK
    string creadoPorNombre
    string metodoPago
    string comprobanteTipo
    string documentoNumero
    string numOperacion
  }

  DETALLE_PEDIDO {
    string pedidoId PK,FK
    string repuestoId PK,FK
    int cantidad
    float precioUnitario
    float subtotalItem
  }

  FAVORITO {
    string usuarioId PK,FK
    string repuestoId PK,FK
    string fechaGuardado
  }

  ITEM_CARRITO {
    string usuarioId PK,FK
    string repuestoId PK,FK
    int cantidad
  }

  KARDEX_OVERRIDE {
    string repuestoId PK,FK
    int stockFisico
    string ultimaActualizacion
  }

  BITACORA_ACTIVIDAD {
    string id PK
    string fecha
    string usuario
    string rol
    string accion
    string detalle
  }
```

---

### 3.7. Diagrama de Máquina de Estados del Pedido y Ciclo de Despacho

Muestra las transiciones que experimenta una orden de repuestos desde su gestación en el carrito hasta su entrega física final en los anaqueles de SMP.

```mermaid
stateDiagram-v2
  [*] --> PreOrden : Seleccion de piezas desde catalogo

  state PreOrden {
    [*] --> CarritoVacio
    CarritoVacio --> ConItems : Agregar repuesto
    ConItems --> ConItems : Modificar cantidad (+ / -)
    ConItems --> CarritoVacio : Vaciar pre-orden
  }

  PreOrden --> Checkout : Confirmar Lista de Cotizacion

  state Checkout {
    [*] --> ValidarFormulario
    ValidarFormulario --> MetodoSeleccionado : Datos de comprobante ingresados
    MetodoSeleccionado --> EvaluandoPago : Validar campos numericos
  }

  Checkout --> Confirmado : Modo Mostrador / Contraentrega SMP
  Checkout --> Pagado : Liquidado con Yape o Tarjeta

  state AlmacenCentralSMP {
    Confirmado --> PendienteDespacho : Asignado a preparacion fisica
    Pagado --> PendienteDespacho : Liquidado para retiro prioritario
    PendienteDespacho --> InspeccionAnaquel : Validacion de codigos OEM
    InspeccionAnaquel --> Entregado : Accion "Marcar Entregado"
  }

  Entregado --> [*] : Orden Archivada y Descontada de Kardex
```

---

### 3.8. Diagrama de Estados de Sesión y Control de Acceso basado en Roles (RBAC)

Modela el ciclo de vida de la sesión de usuario y la segregación estricta de navegación según el rol asignado (`Cliente`, `Asesor`, `Administrador`).

```mermaid
stateDiagram-v2
  [*] --> NoAutenticado : Inicio de la aplicacion

  state NoAutenticado {
    [*] --> FormularioLogin
    FormularioLogin --> ValidandoCredenciales : Presiona Iniciar Sesion
    FormularioLogin --> RecuperandoClave : Solicita Codigo OTP
    RecuperandoClave --> FormularioLogin : Clave actualizada
    ValidandoCredenciales --> FormularioLogin : Error en credenciales
  }

  ValidandoCredenciales --> SesionActiva : Firma SHA-256 Valida

  state SesionActiva {
    [*] --> SegmentacionRoles

    state "Flujo Cliente" as RolCliente {
      CatalogoCliente --> FichaDetalle
      FichaDetalle --> FavoritosCliente
      FavoritosCliente --> PreOrdenCliente
      PreOrdenCliente --> PasarelaPago
      PasarelaPago --> PerfilTributarioCliente
    }

    state "Flujo Asesor (Ventas / ERP)" as RolAsesor {
      MostradorComercial --> RepuestosAltaRotacion
      RepuestosAltaRotacion --> CotizadorMostradorERP
      CotizadorMostradorERP --> ReportesYEstadisticas
    }

    state "Flujo Administrador (Control Total)" as RolAdministrador {
      ControlAnaquelesKardex --> BandejaDespacho
      BandejaDespacho --> ReportesYCatalogoCRUD
      ReportesYCatalogoCRUD --> GestionUsuariosYRoles
    }

    SegmentacionRoles --> RolCliente : rol == 'Cliente'
    SegmentacionRoles --> RolAsesor : rol == 'Asesor'
    SegmentacionRoles --> RolAdministrador : rol == 'Administrador'
  }

  SesionActiva --> NoAutenticado : Accion "Cerrar Sesion" (StorageService.clearSesion)
```

---

### 3.9. Diagrama de Actividades: Flujo del Control de Inventario y Kardex

Especifica la lógica de negocio para la gestión física de existencias y la activación de alertas preventivas en anaqueles.

```mermaid
flowchart TD
  A1(["Inicio: Consulta de Inventario / Kardex"]) --> A2["Consultar catalogo OEM + items personalizados"]
  A2 --> A3{"Existe anulacion en stockOverrides?"}
  A3 -- "Si" --> A4["Cargar cantidad ajustada desde AsyncStorage"]
  A3 -- "No" --> A5["Cargar cantidad nominal base de repuestos.mock.ts"]
  A4 --> A6["Determinar Estado Operativo de Existencias"]
  A5 --> A6

  A6 --> A7{"Stock fisico <= 3 unidades?"}
  A7 -- "Si" --> A8["Asignar Nivel 'Stock Critico' (Badge Rojo de Alerta)"]
  A7 -- "No" --> A9{"Stock entre 4 y 8 unidades?"}
  A9 -- "Si" --> A10["Asignar Nivel 'Stock Medio' (Badge Ambar)"]
  A9 -- "No" --> A11["Asignar Nivel 'Stock Optimo' (Badge Verde)"]

  A8 --> A12{"Tipo de transaccion solicitada"}
  A10 --> A12
  A11 --> A12

  A12 -- "Venta confirmada en tienda" --> A13["Restar unidades vendidas del anaquel"]
  A12 -- "Conteo fisico manual" --> A14["Ingresar valor absoluto verificado por Administrador"]
  A12 -- "Recepcion por Guia de Remision" --> A15["Incrementar saldo (+delta)"]

  A13 --> A16["Ejecutar StorageService.setStockItem(repuestoId, nuevoStock)"]
  A14 --> A16
  A15 --> A16

  A16 --> A17["Persistir mapa en AsyncStorage ('@hurios_stock_overrides')"]
  A17 --> A18["Emitir actualizacion reactiva a Catalogo, Kardex, Reportes y Perfil"]
  A18 --> A19(["Fin de la Operacion de Kardex"])
```

---

## 4. Matriz de Roles y Control de Acceso (RBAC)

El sistema implementa una matriz de privilegios gestionada por `SecurityService.ts` y aplicada en la navegación e interfaces de usuario:

| Operación / Vista del Sistema | Cliente | Asesor de Ventas | Administrador |
| :--- | :---: | :---: | :---: |
| **Exploración de Catálogo y Búsqueda OEM** | Sí | Sí | Sí |
| **Inspección de Piezas con Cámara / Galería** | Sí | Sí | Sí |
| **Lista Personal de Favoritos** | Sí | No | No |
| **Catálogo Rápido de Repuestos de Alta Rotación** | No | Sí | No |
| **Generación de Pre-orden y Checkout Multimodal** | Sí | Sí | No |
| **Registro de DNI / RUC y Dirección en Perfil** | Sí | No | No |
| **Buscador Predictivo de Clientes Registrados (ERP)** | No | Sí | Sí |
| **Emisión de Cotizaciones en Mostrador con RUC** | No | Sí | Sí |
| **Reportes Estadísticos, Filtros y Mantenimiento CRUD** | No | Sí | Sí |
| **Inventario Físico de Anaqueles y Kardex Sede SMP** | No | No | Sí |
| **Bandeja de Despacho y Entrega de Pedidos** | No | No | Sí |
| **Gestión de Usuarios, Asignación de Roles y Restauración** | No | No | Sí |
| **Bitácora de Actividad del Sistema** | No | No | Sí |
| **Cambio de Contraseña (con vista de clave) y Biometría** | Sí | Sí | Sí |

---

## 5. Cuentas Maestras del Sistema y Credenciales de Evaluación

Para auditorías académicas y pruebas de evaluación, el archivo [`StorageService.ts`](file:///d:/Workspace/utp/hurios-rally-app/src/services/StorageService.ts) inicializa y sincroniza automáticamente las cuentas maestras predeterminadas. Los botones de acceso rápido en [`LoginScreen.tsx`](file:///d:/Workspace/utp/hurios-rally-app/src/screens/LoginScreen.tsx) permiten cargar las tres cuentas principales con un solo toque:

| N° | Rol | Nombre Completo | Usuario (`username`) | Correo Corporativo | Contraseña Institucional | Sede Operativa |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | **Cliente** | Carlos Mendoza Silva | `carlos_mendoza` | `carlos_mendoza.cliente@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **2** | **Asesor** | Edu Morales Carlos | `edu_morales` | `edu_morales.ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **3** | **Administrador** | Raúl Quispe Huamán | `raul_quispe` | `raul_quispe.almacen@huriosrally.com` | `Hurios@2026` | Almacén Central / Despacho SMP |
| **4** | **Administrador** | Edu Morales | `admin_rally` | `ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |

> **Directriz de Seguridad (Regex Estricto + Firma SHA-256):**  
> Todas las contraseñas del sistema deben superar la regla de validación de complejidad:  
> `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{8,}$`  
> (Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo) y se almacenan firmadas bajo formato `sha256$hr2026$<digest>`.
>
> Para acceder al banco de datos con usuarios de prueba adicionales y casos de validación detallados, consulte la [Guía de Pruebas de Usuarios](docs/pruebas_usuarios.md).

---

## 6. Pila Tecnológica y Dependencias

| Componente | Tecnología | Versión | Propósito en el Proyecto |
| :--- | :--- | :---: | :--- |
| **Núcleo Móvil** | React Native | 0.88.1 | Framework de renderizado nativo multiplataforma |
| **Plataforma SDK** | Expo | 58.0.22 | Entorno de ejecución, sensores y compatibilidad con Expo Go SDK 58 |
| **Motor UI** | React | 19.3.0 | Librería reactiva de componentes y hooks de estado |
| **Tipado Estricto** | TypeScript | 6.0.3 | Tipado estático y compilación segura en todo el proyecto |
| **Enrutamiento** | React Navigation | 7.0.14 | Navegación nativa por Stack y Bottom Tabs adaptables por rol |
| **Persistencia Local** | AsyncStorage | 2.2.0 | Almacenamiento clave-valor asíncrono y desacoplado |
| **Cámara & Galería** | Expo Camera / ImagePicker | 58.0.x | Captura de fotografías para repuestos y perfiles |
| **Iconografía** | Expo Vector Icons (Ionicons) | 15.0.2 | Simbología vectorial estándar de interfaz |
| **Servidor SMTP** | Node.js / Express | 18+ | Microservicio REST para despacho de códigos OTP |
| **Cliente de Correo** | Nodemailer | 6.9.x | Envío seguro de plantillas HTML transaccionales |

---

## 7. Estructura y Organización del Código Fuente

```text
hurios-rally-app/
├── assets/                          # Logotipos corporativos y recursos gráficos
├── docs/                            # Documentación formal de ingeniería y pruebas
│   ├── diagramas_ingenieria.md      # Especificación completa de diagramas UML
│   └── pruebas_usuarios.md          # Protocolos de prueba y banco de usuarios
├── server/                          # Microservicio backend SMTP (Node.js Express)
│   ├── package.json                 # Dependencias del servidor de correos
│   └── server.js                    # Endpoints /api/send-reset-code y estado de salud
├── src/
│   ├── components/                  # Componentes reutilizables modulares
│   │   ├── CardRepuesto.tsx         # Tarjeta de pieza con precio, OEM y stock
│   │   ├── CategoryPills.tsx        # Selector horizontal de familias automotrices
│   │   ├── ProductImage.tsx         # Renderizador de imágenes con fallback
│   │   └── SearchBar.tsx            # Barra de búsqueda con limpieza rápida
│   ├── context/
│   │   └── CartContext.tsx          # Estado reactivo global de pre-orden e IGV
│   ├── data/
│   │   └── repuestos.mock.ts        # Catálogo canónico de 46 piezas OEM
│   ├── hooks/
│   │   └── useDebouncedValue.ts     # Hook de optimización de búsquedas (180ms)
│   ├── navigation/                  # Orquestación de navegación condicionada por rol
│   │   ├── AppNavigator.tsx         # Stack principal, menú lateral y modales corporativos
│   │   ├── BottomTabNavigator.tsx   # Pestañas inferiores dinámicas según rol RBAC
│   │   └── types.ts                 # Definición de rutas y parámetros de navegación
│   ├── screens/                     # Pantallas del sistema por actor
│   │   ├── CatalogScreen.tsx        # Catálogo general con búsqueda debounced
│   │   ├── CategoriesScreen.tsx     # Explorador de familias de repuestos
│   │   ├── DetailScreen.tsx         # Ficha técnica, compatibilidad e inspección
│   │   ├── FavoritesScreen.tsx      # Pre-orden, checkout y mostrador comercial
│   │   ├── LoginScreen.tsx          # Autenticación, registro y recuperación OTP
│   │   ├── ProfileScreen.tsx        # Perfil, DNI/RUC, cambio de clave y gestión admin
│   │   ├── ReportsScreen.tsx        # Estadísticas financieras, filtros y CRUD de catálogo
│   │   ├── SavedFavoritesScreen.tsx # Favoritos de cliente y repuestos de alta rotación
│   │   ├── WarehouseDispatchScreen.tsx # Monitoreo y despacho de pedidos
│   │   └── WarehouseStockScreen.tsx # Kardex físico y control de anaqueles
│   ├── services/                    # Capa de infraestructura, seguridad y datos
│   │   ├── AuthService.ts           # Lógica de login, registro, OTP y validación Regex
│   │   ├── CameraService.ts         # Integración nativa con cámara y galería
│   │   ├── SecurityService.ts       # Motor SHA-256 UTF-8, tokens de sesión y matriz RBAC
│   │   └── StorageService.ts        # Persistencia en AsyncStorage, CRUD y restauración
│   ├── theme/
│   │   └── colors.ts                # Paleta de colores institucionales de Hurios Rally
│   ├── types/
│   │   └── index.ts                 # Contratos, interfaces y tipos TypeScript
│   └── utils/                       # Utilidades puras de lógica de negocio
│       ├── catalog.ts               # Cálculos de stock, filtros y normalización
│       ├── orders.ts                # Generador de correlativos PED-XXXX y KPI
│       └── validators.ts            # Validadores de Regex, tarjetas y comprobantes
├── App.tsx                          # Punto de entrada principal y proveedores
├── app.json                         # Manifiesto de configuración de Expo
├── package.json                     # Declaración de dependencias (Expo SDK 58)
└── tsconfig.json                    # Reglas del compilador TypeScript
```

---

## 8. Guía de Instalación, Configuración y Despliegue

### Requisitos Previos del Entorno
- **Node.js**: Versión 18.x LTS, 20.x o 22.x.
- **npm**: Versión 9.x o superior.
- **Dispositivo Físico o Emulador**:
  - Dispositivo móvil Android/iOS con la aplicación **Expo Go (SDK 58)** instalada.
  - O emulador Android Studio / Xcode configurado en el sistema anfitrión.

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/EduMoralesCar/HuriosRally-App.git
cd HuriosRally-App
```

### Paso 2: Instalar Dependencias de la Aplicación Móvil
```bash
npm install
```

### Paso 3: Verificar Tipado Estricto de TypeScript
```bash
npx tsc --noEmit
```
*(Debe retornar código de salida `0` sin errores de compilación).*

### Paso 4: Iniciar el Servidor de Desarrollo Expo
```bash
npx expo start -c
```
- Presione `a` para abrir en emulador Android.
- O escanee el código QR desplegado en terminal desde la aplicación **Expo Go** en su smartphone.

### Paso 5 (Opcional): Iniciar el Microservicio Local de Correos SMTP
Si desea probar el despacho real de correos mediante SMTP corporativo:
```bash
cd server
npm install
node server.js
```
El servidor quedará a la escucha en el puerto `3000` con el endpoint de salud `GET /` activo.

---

## 9. Ciclo de Vida del Software y Control de Versiones

El desarrollo del proyecto se rige por la metodología **GitFlow** y la especificación de **Commits Convencionales**:

- **Rama `main`**: Contiene exclusivamente versiones estables aprobadas para pase a producción (Releases oficiales).
- **Rama `dev`**: Rama troncal de integración continua donde se consolidan los módulos verificados.
- **Ramas `feature/*`**: Ramas atómicas de desarrollo por capacidad funcional (ej. `feature/avance-3-roles-reportes-seguridad`).
- **Ramas `fix/*`**: Correcciones puntuales de defectos detectados durante pruebas de integración.

### Estándar de Mensajes de Confirmación (Commits)
- `feat(modulo): descripcion en espanol del nuevo requerimiento`
- `fix(modulo): correccion de defecto o excepcion de ejecucion`
- `docs(modulo): documentacion de ingenieria, diagramas o manuales`
- `refactor(modulo): optimizacion de codigo sin alterar la logica funcional`

---

## 10. Información Institucional y Licencia

Este software ha sido diseñado y desarrollado para fines académicos y corporativos como solución técnica integral para **HURIOS RALLY E.I.R.L.**

```text
Entidad: HURIOS RALLY E.I.R.L.
RUC: 20608542191
Sede Central: Av. Perú 2450, San Martín de Porres, Lima, Perú
Contacto Corporativo: ventas@huriosrally.com | (01) 534-8920
Año de Publicación: 2026
```

Todos los derechos de propiedad intelectual, diseño estructural y código fuente corresponden a **HURIOS RALLY E.I.R.L.** y a los desarrolladores asignados al proyecto. Prohibida su reproducción total o parcial sin autorización expresa de la titular.
