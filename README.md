# Sistema Móvil de Comercio, Cotización ERP y Control de Almacén

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0_Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Layered-orange?style=flat-square)](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)
[![Standard](https://img.shields.io/badge/Standard-IEEE%20830%20%2F%20ISO%2025010-blue?style=flat-square)](https://www.iso.org/standard/35733.html)

**Entidad Titular:** HURIOS RALLY E.I.R.L.  
**RUC:** 20608542191  
**Ubicación:** Av. Perú 2450, San Martín de Porres, Lima Norte  
**Plataforma de Ejecución:** Android / iOS (Motor React Native sobre Expo Go)  

---

## Índice General

1. [Introducción y Descripción del Sistema](#1-introducción-y-descripción-del-sistema)
2. [Especificación de Requisitos y Alcance Funcional](#2-especificación-de-requisitos-y-alcance-funcional)
3. [Diagramas de Ingeniería de Software (UML & Arquitectura)](#3-diagramas-de-ingeniería-de-software-uml--arquitectura)
   - [3.1. Diagrama de Casos de Uso del Sistema](#31-diagrama-de-casos-de-uso-del-sistema)
   - [3.2. Diagrama de Arquitectura de Capas y Componentes](#32-diagrama-de-arquitectura-de-capas-y-componentes)
   - [3.3. Diagrama de Secuencia: Proceso de Cotización, Checkout y Registro de Pedido](#33-diagrama-de-secuencia-proceso-de-cotización-checkout-y-registro-de-pedido)
   - [3.4. Diagrama de Secuencia: Autenticación, Verificación Regex y Recuperación SMTP](#34-diagrama-de-secuencia-autenticación-verificación-regex-y-recuperación-smtp)
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

**Hurios Rally App** es una solución de software móvil multiplataforma desarrollada bajo la disciplina de la Ingeniería de Software para responder a las exigencias operativas y comerciales de **HURIOS RALLY E.I.R.L.**, empresa importadora y distribuidora de repuestos de alto rendimiento automotriz con sede principal en San Martín de Porres (Lima, Perú).

El sistema consolida en una sola aplicación reactiva los tres pilares del negocio:
1. **Comercio Minorista Digital:** Catálogo técnico clasificado por códigos OEM y familias automotrices, con cotización en tiempo real y pasarela multimodal.
2. **Atención en Mostrador (Modo Asesor / ERP):** Interfaz ágil para emisión de proformas presenciales con búsqueda predictiva de clientes registrados, selección de tipo de comprobante (Boleta / Factura con validación RUC) y confirmación de reserva.
3. **Logística y Control de Kardex (Modo Almacenero):** Monitoreo físico de anaqueles por lote, gestión de umbrales de stock crítico y validación de órdenes para despacho inmediato en tienda.

---

## 2. Especificación de Requisitos y Alcance Funcional

| Módulo | Requisito Funcional | Descripción Técnica |
| :--- | :--- | :--- |
| **RF-01** | Autenticación Segura | Inicio de sesión con evaluación Regex de complejidad (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo especial). |
| **RF-02** | Registro Inteligente | Generación algorítmica de credenciales corporativas (`nombre_apellido` y dominio corporativo según rol). |
| **RF-03** | Recuperación OTP | Despacho de código de seguridad de 6 dígitos mediante microservicio SMTP con debounce anti-duplicados. |
| **RF-04** | Catálogo Técnico | 46 piezas OEM en 5 categorías (*Frenos, Suspensión, Motor, Filtros, Accesorios*) con búsqueda debounced (180 ms). |
| **RF-05** | Inspección Visual | Captura de imagen in situ mediante cámara del dispositivo o selección desde galería para asociar fotos a lotes. |
| **RF-06** | Pre-orden & Carrito | Contexto global (`CartContext`) con cálculo automático de Subtotal, IGV (18%) y totalización aislada por usuario. |
| **RF-07** | Pasarela Multimodal | Soporte para Yape/Plin (registro de operación), Tarjeta Débito/Crédito (validación 16 dígitos y CVV) y Contraentrega. |
| **RF-08** | ERP de Mostrador | Selector predictivo de clientes registrados con dropdown de iniciales y autocompletado de razón social y teléfono. |
| **RF-09** | Kardex en Tiempo Real | Sincronización bidireccional de anaqueles, ajuste manual de conteo físico y alerta de stock crítico (≤ 3 unid.). |
| **RF-10** | Control de Despacho | Filtrado de órdenes (*Pendientes, Despachados, Todos*) con acción irreversible de confirmación de entrega física. |

---

## 3. Diagramas de Ingeniería de Software (UML & Arquitectura)

### 3.1. Diagrama de Casos de Uso del Sistema

Representa las interacciones entre los actores del sistema y los casos de uso fundamentales que cubren la operación comercial y logística.

```mermaid
flowchart LR
  subgraph Actores["Actores del Sistema"]
    A1["Actor: Cliente Particular"]
    A2["Actor: Asesor Comercial"]
    A3["Actor: Almacenero"]
    A4["Servicio Externo: Servidor SMTP Node.js"]
  end

  subgraph CasosDeUso["Casos de Uso Principales - Hurios Rally App"]
    UC01["UC01: Autenticacion con Validacion Regex"]
    UC02["UC02: Recuperacion de Clave con Codigo OTP"]
    UC03["UC03: Registro Inteligente de Usuario"]
    UC04["UC04: Explorar Catalogo por Familia Tecnica"]
    UC05["UC05: Inspeccionar Repuesto con Camara / Galeria"]
    UC06["UC06: Gestionar Pre-orden y Carrito Aislado"]
    UC07["UC07: Procesar Checkout Multimodal (Yape / Tarjeta / Efectivo)"]
    UC08["UC08: Busqueda Predictiva ERP de Clientes en Mostrador"]
    UC09["UC09: Emitir Comprobante (Boleta / Factura RUC)"]
    UC10["UC10: Administrar Kardex y Ajuste Fisico de Anaqueles"]
    UC11["UC11: Atender y Confirmar Despacho de Pedidos"]
    UC12["UC12: Configuracion de Perfil y Acceso Biometrico"]
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

  A3 --> UC01
  A3 --> UC10
  A3 --> UC11
  A3 --> UC12

  UC02 -.-> A4
```

---

### 3.2. Diagrama de Arquitectura de Capas y Componentes

Ilustra la separación de responsabilidades bajo una arquitectura en capas desacoplada, donde la vista móvil consume servicios independientes y persiste de manera local y remota.

```mermaid
flowchart TD
  subgraph CapaPresentacion["Capa de Presentacion (React Native / Expo SDK 57)"]
    NavStack["Navigation Container (Stack & Bottom Tabs Adaptables)"]
    subgraph Vistas["Pantallas (Screens)"]
      S_Login["LoginScreen"]
      S_Catalog["CatalogScreen"]
      S_Categories["CategoriesScreen"]
      S_Detail["DetailScreen"]
      S_Favorites["FavoritesScreen (Checkout & Mostrador)"]
      S_Stock["WarehouseStockScreen (Kardex)"]
      S_Dispatch["WarehouseDispatchScreen (Despacho)"]
      S_Profile["ProfileScreen"]
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

  subgraph CapaServicios["Capa de Servicios de Integracion"]
    Srv_Auth["AuthService (Control RBAC, Hashes y OTP)"]
    Srv_Storage["StorageService (Persistencia Aislada por Usuario)"]
    Srv_Camera["CameraService (Sensores de Camara y Galeria)"]
  end

  subgraph CapaPersistencia["Capa de Persistencia y Backend"]
    DB_Async["AsyncStorage (Almacenamiento Local Seguro en Dispositivo)"]
    Srv_SMTP["Microservicio Node.js Express (SMTP Nodemailer Port 3000)"]
  end

  NavStack --> Vistas
  Vistas --> ComponentesUI
  Vistas --> Ctx_Cart
  Vistas --> Hook_Debounce
  Vistas --> Utilitarios
  Vistas --> CapaServicios

  Ctx_Cart --> Srv_Storage
  Srv_Auth --> Srv_Storage
  Srv_Auth --> Srv_SMTP
  Srv_Storage --> DB_Async
```

---

### 3.3. Diagrama de Secuencia: Proceso de Cotización, Checkout y Registro de Pedido

Detalla las invocaciones sincronizadas y asíncronas para validar los datos financieros, descontar stock en Kardex y persistir el pedido en el historial.

```mermaid
sequenceDiagram
  autonumber
  actor Usuario as "Usuario / Asesor"
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

### 3.4. Diagrama de Secuencia: Autenticación, Verificación Regex y Recuperación SMTP

Describe el ciclo de vida del inicio de sesión institucional y la recuperación de clave mediante código de un solo uso (OTP) despachado por el microservicio de correos.

```mermaid
sequenceDiagram
  autonumber
  actor Colaborador as "Colaborador / Cliente"
  participant Login as "LoginScreen"
  participant Auth as "AuthService"
  participant Storage as "StorageService"
  participant SMTP as "Servidor Node.js (Express/Nodemailer)"

  alt Flujo 1: Inicio de Sesion Regular
    Colaborador->>Login: Ingresa usuario/correo y contrasena
    Login->>Auth: login(identificador, password)
    Auth->>Storage: getUsuarios()
    Storage-->>Auth: Retorna usuarios registrados en el sistema
    Auth->>Auth: Valida coincidencia de credenciales
    alt Credenciales validas
      Auth->>Storage: saveSesion(usuarioEncontrado)
      Auth-->>Login: Retorna { success: true, user }
      Login-->>Colaborador: Conmuta navegacion al Rol correspondiente
    else Credenciales invalidas
      Auth-->>Login: Retorna { success: false, message: "Contrasena incorrecta" }
      Login-->>Colaborador: Despliega alerta de autenticacion fallida
    end

  else Flujo 2: Recuperacion de Contrasena con Codigo OTP
    Colaborador->>Login: Selecciona "Olvide mi contrasena" e ingresa correo
    Login->>Auth: sendResetCode(email)
    Auth->>Auth: Genera codigo aleatorio de 6 digitos (expira en 15 min)
    Auth->>SMTP: POST /api/send-reset-code { email, code, userName }
    SMTP-->>Auth: HTTP 200 { success: true, message: "Correo despachado" }
    Auth-->>Login: Codigo enviado exitosamente
    Login-->>Colaborador: Solicita ingreso de OTP y nueva contrasena

    Colaborador->>Login: Ingresa codigo OTP y nueva clave
    Login->>Auth: verifyResetCode(email, code)
    alt Codigo OTP correcto
      Login->>Auth: updatePassword(userId, currentPass, newPass)
      Auth->>Auth: validateStrongPassword(newPass) con Regex
      alt Nueva clave cumple politica estricta (Regex 8+ chars)
        Auth->>Storage: saveUsuario(usuarioActualizado)
        Auth-->>Login: Retorna confirmacion de actualizacion
        Login-->>Colaborador: Notifica exito y permite iniciar sesion
      else Nueva clave no cumple politica
        Auth-->>Login: Retorna error especifico de formato
        Login-->>Colaborador: Solicita clave con mayuscula, numero y simbolo
      end
    else Codigo OTP invalido o vencido
      Auth-->>Login: Retorna error de validacion OTP
      Login-->>Colaborador: Rechaza operacion
    end
  end
```

---

### 3.5. Diagrama de Clases del Dominio

Estructura de clases, interfaces, tipos enumerados y dependencias que conforman el modelo de dominio en TypeScript estricto.

```mermaid
classDiagram
  class RolUsuario {
    <<enumeration>>
    Cliente
    Asesor
    Almacenero
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
    +RolUsuario rol
    +string sede
    +string telefono
    +string fotoPerfilUri
    +boolean biometricsEnabled
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

  class StorageService {
    <<utility>>
    +getUsuarios() Promise~Usuario[]~
    +saveUsuario(u: Usuario) Promise~void~
    +getSesion() Promise~Usuario~
    +saveSesion(u: Usuario) Promise~void~
    +getFavoritos() Promise~Repuesto[]~
    +saveFavoritos(f: Repuesto[]) Promise~void~
    +getCarrito() Promise~ItemCarrito[]~
    +saveCarrito(c: ItemCarrito[]) Promise~void~
    +getStockOverrides() Promise~Record~
    +setStockItem(id: string, s: number) Promise~void~
    +getHistorialPedidos() Promise~PedidoLocal[]~
    +savePedidoEnHistorial(p: PedidoLocal) Promise~void~
    +updatePedidoEstado(id: string, e: EstadoPedido) Promise~void~
  }

  class AuthService {
    <<utility>>
    +login(identificador, pass) Promise~AuthResult~
    +register(datos) Promise~AuthResult~
    +sendResetCode(email) Promise~AuthResult~
    +verifyResetCode(email, code) Promise~AuthResult~
    +updatePassword(id, oldPass, newPass) Promise~AuthResult~
    +validateStrongPassword(pass) PasswordValidation
  }

  Usuario "1" --> "0..*" PedidoLocal : solicita o emite
  PedidoLocal "1" *-- "1..*" ItemCarrito : contiene
  ItemCarrito "1" o-- "1" Repuesto : referencia
  StorageService ..> Usuario : persiste
  StorageService ..> PedidoLocal : persiste
  StorageService ..> Repuesto : persiste
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
  PEDIDO ||--|{ DETALLE_PEDIDO : "contiene"
  REPUESTO ||--o{ DETALLE_PEDIDO : "es referenciado en"
  REPUESTO ||--o{ FAVORITO : "es seleccionado en"
  REPUESTO ||--o{ ITEM_CARRITO : "es reservado en"
  REPUESTO ||--o| KARDEX_OVERRIDE : "registra conteo fisico"

  USUARIO {
    string id PK
    string username UK
    string email UK
    string password
    string nombreCompleto
    string rol
    string sede
    string telefono
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

Modela el ciclo de vida de la sesión de usuario y la segregación estricta de navegación según el rol asignado.

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

  ValidandoCredenciales --> SesionActiva : Credenciales Correctas

  state SesionActiva {
    [*] --> SegmentacionRoles

    state "Flujo Cliente" as RolCliente {
      CatalogoCliente --> FichaDetalle
      FichaDetalle --> PreOrdenCliente
      PreOrdenCliente --> PasarelaPago
      PasarelaPago --> HistorialCliente
    }

    state "Flujo Asesor (Ventas / ERP)" as RolAsesor {
      MostradorComercial --> BusquedaPredictivaClientes
      BusquedaPredictivaClientes --> CotizadorMostrador
      CotizadorMostrador --> MetricasComerciales
    }

    state "Flujo Almacenero (Kardex & Logistica)" as RolAlmacenero {
      ControlAnaqueles --> AjusteKardexFisico
      AjusteKardexFisico --> BandejaDespacho
      BandejaDespacho --> ConfirmacionEntrega
    }

    SegmentacionRoles --> RolCliente : rol == 'Cliente'
    SegmentacionRoles --> RolAsesor : rol == 'Asesor'
    SegmentacionRoles --> RolAlmacenero : rol == 'Almacenero'
  }

  SesionActiva --> NoAutenticado : Accion "Cerrar Sesion" (StorageService.clearSesion)
```

---

### 3.9. Diagrama de Actividades: Flujo del Control de Inventario y Kardex

Especifica la lógica de negocio para la gestión física de existencias y la activación de alertas preventivas en anaqueles.

```mermaid
flowchart TD
  A1(["Inicio: Consulta de Inventario / Kardex"]) --> A2["Consultar catalogo de 46 piezas OEM"]
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
  A12 -- "Conteo fisico manual" --> A14["Ingresar valor absoluto verificado por almacenero"]
  A12 -- "Recepcion por Guia de Remision" --> A15["Incrementar saldo (+delta)"]

  A13 --> A16["Ejecutar StorageService.setStockItem(repuestoId, nuevoStock)"]
  A14 --> A16
  A15 --> A16

  A16 --> A17["Persistir mapa en AsyncStorage ('@hurios_stock_overrides')"]
  A17 --> A18["Emitir actualizacion reactiva a Catalogo, Kardex y Perfil"]
  A18 --> A19(["Fin de la Operacion de Kardex"])
```

---

## 4. Matriz de Roles y Control de Acceso (RBAC)

El sistema implementa una matriz de privilegios basada en perfiles para garantizar la integridad operativa:

| Operación / Vista del Sistema | Cliente | Asesor de Ventas | Almacenero |
| :--- | :---: | :---: | :---: |
| **Exploración de Catálogo y Búsqueda OEM** | Sí | Sí | No |
| **Inspección de Piezas con Cámara / Galería** | Sí | Sí | No |
| **Generación de Pre-orden y Lista de Deseos** | Sí | Sí | No |
| **Checkout Multimodal (Yape, Tarjeta, Mostrador)** | Sí | Sí | No |
| **Buscador Predictivo de Clientes Registrados (ERP)** | No | Sí | No |
| **Emisión de Cotizaciones en Mostrador con RUC** | No | Sí | No |
| **Visualización de Métricas de Venta y Proformas** | No | Sí | No |
| **Inventario Físico de Anaqueles y Kardex Sede SMP** | No | No | Sí |
| **Ajuste Manual e Incremental de Stock Físico** | No | No | Sí |
| **Bandeja de Despacho y Marcado de Pedidos Entregados** | No | No | Sí |
| **Configuración de Perfil y Acceso Biométrico** | Sí | Sí | Sí |

---

## 5. Cuentas Maestras del Sistema y Credenciales de Evaluación

Para auditorías académicas y pruebas de evaluación, el archivo `StorageService.ts` auto-inicializa tres cuentas maestras predeterminadas. Los botones de acceso rápido en el `LoginScreen` cargan sus credenciales con un solo toque:

| N° | Rol | Nombre Completo | Usuario (`username`) | Correo Corporativo | Contraseña Institucional | Sede Operativa |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | **Cliente** | Carlos Mendoza Silva | `carlos_mendoza` | `carlos_mendoza.cliente@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **2** | **Asesor** | Edu Morales Carlos | `edu_morales` | `edu_morales.ventas@huriosrally.com` | `Hurios@2026` | Lima Norte / SMP (Sede Central) |
| **3** | **Almacenero** | Raúl Quispe Huamán | `raul_quispe` | `raul_quispe.almacen@huriosrally.com` | `Hurios@2026` | Almacén Central / Despacho SMP |

> **Directriz de Seguridad (Regex Estricto):**  
> Todas las contraseñas del sistema deben superar la regla de validación de complejidad:  
> `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{8,}$`  
> (Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo).
>
> Para acceder al banco de datos con 5 usuarios de prueba listos para registro y casos de prueba detallados, consulte la [Guía de Pruebas de Usuarios](docs/pruebas_usuarios.md).

---

## 6. Pila Tecnológica y Dependencias

| Componente | Tecnología | Versión | Propósito en el Proyecto |
| :--- | :--- | :---: | :--- |
| **Núcleo Móvil** | React Native | 0.86.3 | Framework de renderizado nativo declarativo |
| **Plataforma SDK** | Expo | 57.0.24 | Entorno de empaquetado, sensores y runtime |
| **Tipado Estricto** | TypeScript | 6.0.3 | Tipado estático y compilación segura en todo el codebase |
| **Enrutamiento** | React Navigation | 7.0.14 | Navegación nativa por Stack y Bottom Tabs dinámicas |
| **Persistencia Local** | AsyncStorage | 2.2.0 | Almacenamiento clave-valor asíncrono y desacoplado |
| **Cámara & Galería** | Expo Camera / ImagePicker | 57.0.x | Captura de evidencias de piezas automotrices |
| **Iconografía** | Expo Vector Icons (Ionicons) | 15.0.2 | Simbología vectorial técnica estandarizada |
| **Servidor SMTP** | Node.js / Express | 18+ | Microservicio REST para despacho de códigos OTP |
| **Cliente de Correo** | Nodemailer | 6.9.x | Envío seguro de plantillas HTML transaccionales |

---

## 7. Estructura y Organización del Código Fuente

```text
hurios-rally-app/
├── assets/                          # Logotipos corporativos y assets gráficos
├── docs/                            # Documentación formal de ingeniería y pruebas
│   ├── diagramas_ingenieria.md      # Especificación completa de diagramas UML
│   └── pruebas_usuarios.md          # Protocolos de prueba y banco de usuarios
├── server/                          # Microservicio backend SMTP (Node.js Express)
│   ├── package.json                 # Dependencias del servidor de correos
│   └── server.js                    # Endpoints /api/send-reset-code y salud
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
│   ├── navigation/
│   │   └── RootNavigator.tsx        # Orquestación de navegación condicionada por rol
│   ├── screens/                     # Pantallas del sistema por actor
│   │   ├── CatalogScreen.tsx        # Catálogo general con búsqueda debounced
│   │   ├── CategoriesScreen.tsx     # Explorador de familias de repuestos
│   │   ├── DetailScreen.tsx         # Ficha técnica, compatibilidad e inspección
│   │   ├── FavoritesScreen.tsx      # Pre-orden, checkout y mostrador comercial
│   │   ├── LoginScreen.tsx          # Autenticación, registro y recuperación OTP
│   │   ├── ProfileScreen.tsx        # Auditoría de cuenta, biometría y métricas
│   │   ├── SavedFavoritesScreen.tsx # Lista personal de piezas destacadas
│   │   ├── WarehouseDispatchScreen.tsx # Monitoreo y despacho de pedidos
│   │   └── WarehouseStockScreen.tsx # Kardex físico y control de anaqueles
│   ├── services/                    # Capa de infraestructura y acceso a datos
│   │   ├── AuthService.ts           # Lógica de login, hashes, OTP y Regex
│   │   ├── CameraService.ts         # Integración nativa con cámara y álbum
│   │   └── StorageService.ts        # Abstracción de persistencia con AsyncStorage
│   ├── theme/
│   │   └── colors.ts                # Paleta de colores institucionales de Rally
│   ├── types/
│   │   └── index.ts                 # Contratos, interfaces y tipos TypeScript
│   └── utils/                       # Utilidades puras de lógica matemática
│       ├── catalog.ts               # Cálculos de stock, filtros y normalización
│       ├── orders.ts                # Generador de correlativos PED-XXXX y KPI
│       └── validators.ts            # Validadores de Regex, tarjetas y comprobantes
├── App.tsx                          # Punto de entrada principal y proveedores
├── app.json                         # Manifiesto de configuración de Expo
├── package.json                     # Declaración de dependencias de la app móvil
└── tsconfig.json                    # Reglas del compilador TypeScript
```

---

## 8. Guía de Instalación, Configuración y Despliegue

### Requisitos Previos del Entorno
- **Node.js**: Versión 18.x LTS o superior.
- **npm**: Versión 9.x o superior.
- **Dispositivo Físico o Emulador**:
  - Dispositivo móvil Android/iOS con la aplicación **Expo Go** instalada.
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
*(Debe retornar código de salida `0` sin advertencias).*

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

El desarrollo del proyecto se rige estrictamente por la metodología **GitFlow** y la especificación de **Commits Convencionales**:

- **Rama `main`**: Contiene exclusivamente versiones estables aprobadas para pase a producción (Releases oficiales).
- **Rama `dev`**: Rama troncal de integración continua donde se consolidan los módulos probados.
- **Ramas `feature/*`**: Ramas atómicas de desarrollo por capacidad funcional (ej. `feature/app-optimization-and-clean-ui`, `feature/auth-security-and-cart-isolation`).
- **Ramas `fix/*`**: Correcciones quirúrgicas de bugs detectados durante pruebas de integración.

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
