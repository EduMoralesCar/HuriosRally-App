# Especificación de Diagramas de Ingeniería de Software

**Proyecto:** Hurios Rally App  
**Entidad Titular:** HURIOS RALLY E.I.R.L.  
**Estándar Aplicado:** UML 2.5 / C4 Model / ISO/IEC/IEEE 29148  
**Fecha de Publicación:** 2026  

---

## 1. Introducción y Metodología de Modelado

Este documento reúne el conjunto de artefactos de modelado estructural y de comportamiento del sistema **Hurios Rally App**. Los diagramas han sido elaborados utilizando la sintaxis estándar de **Mermaid**, permitiendo su renderizado nativo en repositorios Git y herramientas de integración continua.

El modelado abarca las siguientes dimensiones de ingeniería:
- **Vista Funcional:** Casos de uso e interacción de actores.
- **Vista Estructural:** Arquitectura en capas, clases del dominio y entidad-relación.
- **Vista Dinámica:** Diagramas de secuencia y flujos de actividades.
- **Vista de Comportamiento:** Máquinas de estados finitos para ciclo de vida de órdenes y sesiones RBAC.

---

## 2. Diagrama de Casos de Uso del Sistema (UML Use Case)

### Descripción
El sistema interactúa con tres actores humanos primarios con roles segregados (**Cliente**, **Asesor de Ventas** y **Almacenero**) y un actor secundario externo correspondiente al **Servicio SMTP Node.js** para el despacho de códigos OTP.

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

## 3. Diagrama de Arquitectura de Capas y Componentes

### Descripción
La solución aplica una arquitectura en capas desacoplada. La interfaz de usuario móvil consume estados reactivos globales y delega la persistencia a módulos utilitarios y servicios aislados de infraestructura.

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

## 4. Diagramas de Secuencia (Interacción Cronológica)

### 4.1. Flujo de Emisión de Cotización y Checkout
Describe el proceso mediante el cual un usuario o asesor valida los datos del cliente, calcula los impuestos de ley (IGV 18%), registra la orden correlativa y vacía la pre-orden activa.

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

### 4.2. Flujo de Autenticación y Recuperación con Código OTP
Describe la verificación de directivas de complejidad en contraseñas y la comunicación con el microservicio SMTP.

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

## 5. Diagrama de Clases del Dominio (UML Class Diagram)

### Descripción
Representa los contratos de datos (interfaces), enumeraciones y servicios utilitarios implementados en TypeScript.

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

## 6. Diagrama de Entidad - Relación (ER Diagram)

### Descripción
Modelo conceptual y lógico que define la integridad referencial y las llaves primarias/foráneas en el motor de persistencia.

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

## 7. Diagramas de Máquinas de Estados

### 7.1. Ciclo de Vida del Pedido y Proceso de Despacho
Modela las fases por las que transita una orden desde el ensamblado de la pre-orden hasta la entrega material de los repuestos en el mostrador de San Martín de Porres.

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

### 7.2. Estados de Sesión y Control de Acceso basado en Roles (RBAC)
Ilustra el bloqueo de navegación y la conmutación de paneles según el rol del colaborador activo.

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

## 8. Diagrama de Actividades: Flujo del Control de Inventario y Kardex

### Descripción
Detalla el algoritmo de determinación de existencia física en anaquel, categorización visual preventiva (óptimo, medio, crítico) y persistencia reactiva.

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

## 9. Patrones de Diseño Implementados

1. **Singleton & Facade (`StorageService` y `AuthService`):** Proporcionan puntos únicos de acceso simplificado a subsistemas complejos de almacenamiento asíncrono y encriptación.
2. **Observer / Context Provider (`CartContext`):** Desacopla la vista de los cálculos comerciales, notificando automáticamente a todas las pantallas dependientes cuando se alteran las cantidades o el inventario.
3. **Debounce Pattern (`useDebouncedValue`):** Reduce la carga de CPU y la degradación de fotogramas por segundo (FPS) al diferir el filtrado de listas complejas hasta que el usuario pause la escritura durante 180 ms.
4. **Strategy Pattern (`validators.ts`):** Encapsula familias de algoritmos de validación (Regex de contraseñas, formato Luhn para tarjetas y validación tributaria de RUC) bajo interfaces uniformes.
