# ShipNow API — Backend Profesional de Logística y Envíos

API RESTful profesional para la gestión integral de operaciones logísticas, trazabilidad de pedidos de paquetería, asignación de repartidores (*couriers*), gestión documental y comprobantes de entrega. Desarrollada con arquitectura por capas, estándares limpios de desarrollo, logging estructurado, pruebas automatizadas y contenedores Docker para producción.

---

## Índice

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Tecnologías](#tecnologías)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Variables de Entorno](#variables-de-entorno)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [Ejecución Local](#ejecución-local)
8. [Ejecución de Pruebas](#ejecución-de-pruebas)
9. [Documentación con Swagger](#documentación-con-swagger)
10. [Despliegue con Docker](#despliegue-con-docker)
11. [Aclaraciones sobre Logging](#aclaraciones-sobre-logging)
12. [Aclaraciones sobre Carga de Archivos](#aclaraciones-sobre-carga-de-archivos)
13. [Contrato de Respuestas de la API](#contrato-de-respuestas-de-la-api)
14. [Endpoints Principales](#endpoints-principales)
15. [Licencia](#licencia)

---

## Descripción del Proyecto

**ShipNow** es una plataforma backend que resuelve el ciclo de vida completo de un servicio de logística y distribución:
- **Gestión de Usuarios y Roles:** Control de acceso granular para Clientes (`user`), Repartidores (`courier`) y Administradores (`admin`).
- **Gestión de Envíos/Pedidos (*Orders*):** Creación, cotización, actualización y máquina de estados controlada (`created`, `in_transit`, `delivered`, `cancelled`).
- **Trazabilidad de Entregas (*Deliveries*):** Asignación de pedidos a repartidores, seguimiento de estado y registro automático de fecha/hora de entrega (`deliveredAt`).
- **Gestión Documental y Comprobantes (*Documents*):** Subida segura de identificaciones, licencias de conducir y comprobantes de entrega mediante Multer, con metadatos asociados en base de datos.
- **Simulación de Datos (*Mocks*):** Generación de datos volátiles en memoria y sembrado controlado en base de datos para pruebas de carga y desarrollo.
- **Observabilidad y Diagnóstico:** Registro de trazas multinivel con Winston y endpoint interactivo para auditoría de logs.

---

## Tecnologías

- **Runtime & Lenguaje:** Node.js (v20+ LTS) con módulos nativos ECMAScript (ESM) y JavaScript moderno.
- **Framework Web:** Express 5.
- **Base de Datos & ODM:** MongoDB 7 con Mongoose 9 y plugin `mongoose-paginate-v2`.
- **Autenticación & Seguridad:** JWT (`jsonwebtoken`), hash de contraseñas con `bcrypt`, `cors`, `express-rate-limit` y sanitización contra path traversal.
- **Carga de Archivos:** `multer` con validación estricta de MIME types y límites de peso.
- **Logging:** `winston` con niveles personalizados, rotación de archivos (`winston-daily-rotate-file` / `maxsize`), formato JSON para producción y enmascaramiento de datos sensibles.
- **Documentación:** Swagger UI (`swagger-ui-express`) y especificación OpenAPI 3.0 (`js-yaml`).
- **Testing:** Mocha, Chai, Supertest y `mongodb-memory-server` para aislamiento total sin dependencias externas; cobertura de código mediante `c8`.
- **Contenedores:** Docker (Dockerfile optimizado multi-stage con usuario no-root `node`) y Docker Compose v2.

---

## Arquitectura del Sistema

El proyecto sigue una estricta **arquitectura por capas desacoplada**, garantizando separación de responsabilidades, testabilidad y alta mantenibilidad:

```text
                        Petición HTTP entrante
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Middlewares de Aplicación                    │
│   (CORS, Trust Proxy, Rate Limiter, Body Parser 1MB, HTTP Logger) │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                              Routers                              │
│       (Prefijos duales /api y /api/v1 -> Enrutamiento modular)    │
│            Validadores de Esquema y Guards de Seguridad           │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                            Controllers                            │
│     (Recepción de parámetros, delegación a Servicios y armado     │
│             de respuesta JSON con código HTTP unificado)          │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                             Services                              │
│       (Lógica de negocio, reglas de dominio, transiciones de      │
│        estados, hashing de credenciales y orquestación)           │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Data Access Objects (DAOs)                     │
│    (Abstracción de acceso a datos, proyecciones seguras, filtros, │
│            ordenamiento y paginación con lean queries)            │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                         Models (Mongoose)                         │
│           (Esquemas de MongoDB, índices compuestos, tipos)        │
└───────────────────────────────────────────────────────────────────┘
```

### Responsabilidades de las Carpetas

- `src/config/`: Configuración centralizada de la aplicación (`config.js` es el **único** lector de `process.env`), conexión a base de datos (`db.js`), configuración de Multer, Swagger y niveles de log.
- `src/constants/`: Diccionario inmutable de constantes del dominio (roles, estados de pedidos y entregas, catálogo de errores y códigos HTTP, configuración de paginación y rangos de mocks).
- `src/controllers/`: Controladores encargados de la capa de transporte HTTP.
- `src/dao/`: Modelos de Mongoose (`models/`) y clases Data Access Object (`repositories/`) que aíslan las consultas a la base de datos.
- `src/dto/`: *Data Transfer Objects* para moldear y filtrar las respuestas hacia el cliente, asegurando que nunca se expongan campos sensibles (como `password` o rutas de disco).
- `src/middlewares/`: Middlewares reutilizables de autenticación, autorización por roles (RBAC), control de rate limiting, validación de schemas, manejo global de errores y protección de endpoints internos.
- `src/routes/`: Definición declarativa de rutas y montaje modular.
- `src/services/`: Capa con la lógica de negocio pura del sistema.
- `src/utils/`: Funciones auxiliares reutilizables (`logger`, `CustomError`, `errorFactory`, `hashPassword`, `asyncHandler`).
- `src/validators/`: Funciones middleware de validación sincrónica de payloads entrantes.

---

## Estructura del Proyecto

```text
.
├── .dockerignore                 # Exclusiones de contexto para build de Docker
├── .editorconfig                 # Reglas estándar de formateo de código
├── .env.example                  # Plantilla de variables de entorno requeridas
├── .gitignore                    # Reglas de exclusión para Git (logs, uploads, .env)
├── .mocharc.json                 # Configuración del ejecutor de tests (Mocha)
├── docker-compose.yml            # Orquestación de contenedores (API + MongoDB)
├── Dockerfile                    # Construcción multi-stage de la imagen de producción
├── docs/
│   └── openapi.yaml              # Especificación OpenAPI 3.0 (fuente única de Swagger)
├── eslint.config.js              # Configuración de ESLint con reglas de código limpio
├── LICENSE                       # Licencia de código abierto MIT
├── package.json                  # Dependencias y scripts de ejecución
├── README.md                     # Documentación técnica completa
├── src/
│   ├── app.js                    # Creación y configuración de la aplicación Express
│   ├── server.js                 # Inicialización del servidor HTTP y graceful shutdown
│   ├── config/                   # Configuración central (env, db, multer, swagger, logs)
│   ├── constants/                # Constantes del dominio (roles, estados, errores)
│   ├── controllers/              # Controladores de recursos HTTP
│   ├── dao/
│   │   ├── models/               # Esquemas e índices Mongoose (User, Order, Delivery, Document)
│   │   └── repositories/         # Clases DAO de acceso a datos y paginación
│   ├── dto/                      # Transformadores de salida de datos (User, Order, Delivery, List)
│   ├── middlewares/              # Middlewares de seguridad, auth, validación y errores
│   ├── routes/                   # Enrutadores modulares de la API
│   ├── services/                 # Servicios con la lógica de negocio
│   ├── utils/                    # Logger Winston, fábrica de errores, hash de contraseñas
│   └── validators/               # Validadores de datos de entrada
├── test/
│   ├── helpers/                  # Base en memoria, factories de Faker y helpers de autenticación
│   ├── integration/              # Pruebas de integración sobre endpoints de la API
│   ├── setup/                    # Hooks globales de ejecución y limpieza
│   └── unit/                     # Pruebas unitarias de utilidades, DAOs y servicios
└── uploads/
    ├── .gitkeep                  # Preserva el directorio vacío en el repositorio
    ├── documents/                # Directorio en disco para documentos de usuarios
    └── proofs/                   # Directorio en disco para comprobantes de envíos
```

---

## Variables de Entorno

El archivo `src/config/config.js` es el **único punto de acceso a `process.env`**, aplicando fail-fast en el arranque ante variables obligatorias faltantes y convirtiendo los valores a sus tipos primitivos correspondientes.

Copie la plantilla de variables antes de iniciar el proyecto:

```bash
cp .env.example .env
```

| Variable | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | Entorno de ejecución (`development`, `production`, `test`). |
| `PORT` | Número | `3000` | Puerto HTTP donde escuchará el servidor. |
| `MONGODB_URI` | String | *(Obligatorio)* | URI de conexión a la base de datos MongoDB. |
| `MONGODB_URI_TEST` | String | *Opcional* | URI alternativa si se desea correr pruebas contra una base fija en lugar de memoria. |
| `JWT_SECRET` | String | *(Obligatorio)* | Clave secreta para la firma y verificación de tokens JWT. |
| `JWT_EXPIRES_IN` | String | `2h` | Tiempo de expiración de los tokens emitidos. |
| `INTERNAL_TOKEN` | String | *(Obligatorio en prod)* | Token estático requerido para acceder a módulos de mocks y auditoría en producción. |
| `UPLOAD_DIR` | String | `uploads` | Carpeta raíz local donde Multer almacena los binarios. |
| `MAX_FILE_SIZE_MB` | Número | `5` | Tamaño máximo permitido por archivo subido (en Megabytes). |
| `MIME_ALLOWED_DOCUMENTS`| String | `application/pdf,image/jpeg,image/png` | Lista separada por comas de tipos MIME válidos para documentos. |
| `MIME_ALLOWED_PROOFS` | String | `application/pdf,image/jpeg,image/png,application/xml` | Lista separada por comas de tipos MIME válidos para comprobantes. |
| `MOCKS_MAX_AMOUNT` | Número | `100` | Límite máximo de registros a generar en una sola operación de sembrado. |
| `DEFAULT_PAGE_SIZE` | Número | `10` | Cantidad de elementos devueltos por página si no se especifica `limit`. |
| `MAX_PAGE_SIZE` | Número | `100` | Límite superior estricto para el parámetro `limit` de paginación. |
| `RATE_LIMIT_WINDOW_MS` | Número | `900000` | Ventana temporal para la tasa de peticiones (15 minutos en milisegundos). |
| `RATE_LIMIT_MAX` | Número | `100` | Cantidad máxima de peticiones permitidas por IP dentro de la ventana. |
| `LOG_LEVEL` | String | `info` | Nivel mínimo de severidad para registrar trazas en el logger. |
| `LOG_FORMAT` | String | `json` | Formato de logs (`json` en producción; formateado legible en desarrollo). |
| `CORS_ORIGIN` | String | `*` | Orígenes autorizados para el middleware de CORS. |

---

## Instalación y Configuración

### Prerrequisitos
- Node.js versión 20.0.0 o superior.
- Gestor de paquetes `npm`.
- Instancia local de MongoDB o Docker instalado.

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd backendIII_2026
   ```

2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Configurar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
   *Edite `.env` con sus credenciales locales de MongoDB y una clave segura para `JWT_SECRET`.*

---

## Ejecución Local

### Modo Desarrollo (con recarga automática)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

### URLs Base y Compatibilidad de Prefijos
La API cuenta con soporte dual de prefijos para compatibilidad absoluta con clientes antiguos y nuevos:
- **Prefijo Versionado (Recomendado):** `http://localhost:3000/api/v1`
- **Prefijo Directo (Alias):** `http://localhost:3000/api`

Verificación inmediata de salud de la aplicación:
```bash
curl http://localhost:3000/api/v1/health
```

---

## Ejecución de Pruebas

El proyecto cuenta con una suite integral de **123 tests automatizados** (unitarios y de integración) diseñados con Mocha, Chai y Supertest.

Las pruebas de integración utilizan `mongodb-memory-server`, levantando un servidor MongoDB transitorio e independiente en memoria: **las pruebas nunca tocan la base de datos de desarrollo ni requieren un motor de base de datos instalado previamente**.

```bash
# Ejecutar la suite completa de pruebas
npm test

# Ejecutar únicamente las pruebas unitarias (sin base de datos)
npm run test:unit

# Ejecutar únicamente las pruebas de integración
npm run test:integration

# Ejecutar las pruebas generando reporte de cobertura de código
npm run test:coverage

# Ejecutar el linter para verificar reglas de estilo
npm run lint
```

---

## Documentación con Swagger

La especificación OpenAPI 3.0 se gestiona de forma centralizada en el archivo `docs/openapi.yaml`. La aplicación implementa validación de cobertura bidireccional en desarrollo, garantizando que el documento se encuentre 100% sincronizado con las rutas reales del servidor.

### Acceso a la Interfaz Interactiva
- Swagger UI (versión recomendada): [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)
- Swagger UI (alias directo): [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Acceso al Esquema JSON
- OpenAPI JSON Spec: [http://localhost:3000/api/v1/docs.json](http://localhost:3000/api/v1/docs.json)
- OpenAPI JSON Spec (alias): [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

---

## Despliegue con Docker

El proyecto incluye soporte nativo para contenedores mediante un **Dockerfile multi-stage** optimizado y una configuración de **Docker Compose** lista para producción.

### Características de la Imagen Docker
- **Multi-Stage Build:** Etapa de dependencias (`deps`), validación de linter (`builder`) y contenedor final de runtime (`production`) sobre `node:20-alpine`.
- **Seguridad:** El contenedor corre bajo el usuario sin privilegios `node` (no `root`).
- **Ligereza:** No viajan dependencias de desarrollo (`npm ci --omit=dev`), eliminando herramientas como Mocha, Chai o ESLint de la imagen final.
- **Healthcheck Integrado:** Sondeo periódico contra `/api/v1/health/ready` para asegurar la conectividad con la base de datos antes de enrutar tráfico.

### Comandos de Ejecución

```bash
# Construir la imagen de la API
docker compose build

# Levantar los servicios (API + MongoDB) en segundo plano
docker compose up -d

# Comprobar el estado y verificar que ambos servicios estén "(healthy)"
docker compose ps

# Inspeccionar logs en tiempo real del contenedor de la API
docker compose logs -f api

# Detener los servicios conservando el volumen de datos de MongoDB
docker compose down

# Detener los servicios y eliminar volúmenes asociados
docker compose down -v
```

El servicio `api` utiliza `depends_on` con `condition: service_healthy` sobre el servicio `mongo`, impidiendo que la API inicie hasta que el motor de base de datos responda positivamente al comando `ping`.

---

## Aclaraciones sobre Logging

El sistema utiliza **Winston** como motor centralizado de observabilidad con configuración desacoplada en `src/utils/logger.js`:

1. **Niveles Personalizados:**
   - `fatal` (0) — Errores críticos que comprometen la continuidad del servicio.
   - `error` (1) — Excepciones no controladas o fallas operacionales graves.
   - `warn` (2) — Advertencias de dominio, intentos de acceso no autorizados o errores de cliente.
   - `info` (3) — Eventos clave del ciclo de vida (inicio de servidor, conexión a base de datos).
   - `http` (4) — Registro automático por petición entrante (método, ruta, status, tiempo de respuesta, IP y `requestId` único).
   - `debug` (5) — Trazas internas de servicios para depuración en desarrollo.

2. **Formato por Entorno:**
   - **Desarrollo:** Consola formateada, coloreada y legible para el desarrollador.
   - **Producción:** Salida estrictamente estructurada en formato **JSON** de una línea por evento, optimizada para ingestores de logs (Datadog, ElasticSearch, CloudWatch). La salida estándar por consola queda deshabilitada para evitar fugas y degradación de rendimiento.

3. **Enmascaramiento Estricto de Datos Sensibles (*Data Redaction*):**
   El formateador `formatRedact()` intercepta y enmascara de manera recursiva cualquier campo confidencial antes de que sea procesado por los transportes de Winston, reemplazando su valor por `[REDACTED]`. Esto aplica a `password`, `passwordHash`, `token`, `secret`, cadenas de conexión, tarjetas de crédito y números de documentos.

4. **Persistencia y Rotación:**
   - `logs/error.log`: Registra eventos con severidad `error` y `fatal`.
   - `logs/combined.log`: Registra todas las trazas según el `LOG_LEVEL` configurado.
   - Rotación automática al alcanzar **5 MB**, manteniendo un historial de hasta **5 archivos**.
   - Los archivos de logs nunca se versionan en Git (están excluidos por `.gitignore`).

5. **Endpoints de Auditoría y Diagnóstico:**
   - `GET /loggerTest` (o `/api/loggerTest`): Ejecuta y emite trazas de prueba en los 6 niveles de Winston para verificar el pipeline de logging.
   - `GET /api/v1/logger/recent`: Consulta las últimas líneas del archivo de log general (requiere rol `admin`).
   - `GET /api/v1/logger/error-lines`: Consulta las líneas del archivo de errores (requiere rol `admin`).

---

## Aclaraciones sobre Carga de Archivos

La carga y gestión de archivos se implementa mediante **Multer** (`src/config/multer.js`) y el servicio de documentos (`src/services/documents.service.js`):

1. **Almacenamiento y Seguridad de Disco:**
   - Los archivos se almacenan en el sistema de archivos local (`uploads/documents/` y `uploads/proofs/`).
   - Cada archivo recibe un nombre generado de forma determinista y única: `${Date.now()}-${crypto.randomUUID()}.${ext}`.
   - Se valida cada ruta mediante `resolveInsideUploadRoot` para prevenir de manera infalible ataques de **Path Traversal**.

2. **Validación de Tipos MIME y Límites:**
   - **Documentos de Usuario y Licencias:** Solo formatos `application/pdf`, `image/jpeg` e `image/png`.
   - **Comprobantes de Entrega:** Formatos `application/pdf`, `image/jpeg`, `image/png` y `application/xml`.
   - Límite global por archivo configurable mediante `MAX_FILE_SIZE_MB` (por defecto **5 MB**). Si se excede, la API rechaza la petición con código `413 PAYLOAD_TOO_LARGE`.

3. **Desacoplamiento y Persistencia de Metadatos:**
   - La base de datos MongoDB **únicamente almacena los metadatos** del archivo (nombre original, nombre almacenado, tipo de documento, MIME, tamaño, referencia al padre y propietario).
   - La ruta física en disco **nunca se expone al cliente** (`toDocumentDTO` filtra el campo `path` y genera una URL de descarga segura).

4. **Descargas Seguras y Eliminación Atómica:**
   - Las descargas se realizan a través de endpoints dedicados con streaming controlado (`res.download`), verificando que el usuario autenticado sea el propietario del documento o un administrador.
   - La eliminación de un documento (`DELETE`) es atómica: remueve la referencia en el modelo padre, elimina el metadato en MongoDB y borra el archivo físico en el disco.

5. **Saneamiento de la Carpeta `uploads/`:**
   - La carpeta `uploads/` se encuentra saneada en el repositorio; únicamente contiene `.gitkeep` para preservar la estructura de directorios. Ningún archivo binario de pruebas locales se sube al control de versiones.

---

## Contrato de Respuestas de la API

Todas las respuestas emitidas por la API respetan un formato JSON predecible y estandarizado:

### Respuesta Exitosa Simple
```json
{
  "status": "success",
  "data": {
    "id": "660c1d2e8b9f1a2b3c4d5e6f",
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "user"
  }
}
```

### Respuesta Exitosa con Paginación
```json
{
  "status": "success",
  "data": [
    {
      "id": "660c1d2e8b9f1a2b3c4d5e6f",
      "trackingNumber": "SN-ABC-12345",
      "status": "created",
      "weight": 2.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Respuesta de Error
```json
{
  "status": "error",
  "error": "RESOURCE_NOT_FOUND",
  "message": "El recurso solicitado no fue encontrado en la base de datos."
}
```

---

## Endpoints Principales

*Nota: Todos los endpoints de negocio responden tanto bajo el prefijo `/api/v1` como bajo `/api`.*

### Autenticación (`/auth`)
| Método | Endpoint | Rol / Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Público | Registro de nuevos usuarios en el sistema. |
| `POST` | `/api/v1/auth/login` | Público | Autenticación de credenciales y emisión de token JWT. |
| `GET` | `/api/v1/auth/me` | Autenticado | Devuelve la identidad y datos del usuario conectado. |

### Usuarios (`/users`)
| Método | Endpoint | Rol / Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Autenticado | Listado paginado de usuarios (admite `page`, `limit`, `sort`). |
| `POST` | `/api/v1/users` | `admin` | Creación administrativa de usuarios. |
| `GET` | `/api/v1/users/:id` | Autenticado | Obtiene el detalle de un usuario por su identificador. |
| `PUT` | `/api/v1/users/:id` | `admin` | Actualiza la información de un usuario existente. |
| `DELETE` | `/api/v1/users/:id` | `admin` | Elimina un usuario del sistema. |
| `POST` | `/api/v1/users/:id/documents` | Propietario / `admin` | Sube documentos de identificación para un usuario. |
| `POST` | `/api/v1/users/:id/license` | Propietario (`courier`) | Sube la licencia de conducir de un repartidor. |
| `GET` | `/api/v1/users/:id/documents` | Propietario / `admin` | Lista los documentos asociados a un usuario. |
| `GET` | `/api/v1/users/:id/documents/:docId/download` | Propietario / `admin` | Descarga el archivo binario de un documento del usuario. |

### Pedidos / Envíos (`/orders`)
| Método | Endpoint | Rol / Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders` | Autenticado | Listado paginado de pedidos de paquetería. |
| `POST` | `/api/v1/orders` | Autenticado | Crea un nuevo pedido con código de tracking único. |
| `GET` | `/api/v1/orders/:id` | Autenticado | Obtiene la información detallada de un pedido. |
| `PUT` | `/api/v1/orders/:id` | `admin` | Actualiza los datos generales de un pedido. |
| `PATCH` | `/api/v1/orders/:id/status` | Autenticado | Modifica el estado del pedido validando la máquina de estados. |
| `DELETE` | `/api/v1/orders/:id` | `admin` | Elimina un pedido del sistema. |
| `POST` | `/api/v1/orders/:id/proofs` | Propietario / `admin` | Sube comprobantes asociados al pedido. |
| `GET` | `/api/v1/orders/:id/proofs` | Propietario / `admin` | Lista los comprobantes asociados a un pedido. |

### Entregas (`/deliveries`)
| Método | Endpoint | Rol / Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/deliveries` | Autenticado | Listado paginado de entregas logísticas. |
| `POST` | `/api/v1/deliveries` | `admin` | Asigna un pedido a un repartidor (*courier*). |
| `GET` | `/api/v1/deliveries/:id` | Autenticado | Obtiene el detalle de una entrega. |
| `PATCH` | `/api/v1/deliveries/:id/status` | `courier` / `admin` | Actualiza el estado de entrega y registra `deliveredAt`. |
| `POST` | `/api/v1/deliveries/:id/proofs` | `courier` / `admin` | Sube el comprobante de entrega en destino. |
| `GET` | `/api/v1/deliveries/:id/proofs` | Autenticado | Lista los comprobantes vinculados a la entrega. |

### Documentos (`/documents`)
| Método | Endpoint | Rol / Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/documents` | Autenticado | Listado paginado general de metadatos de documentos. |
| `GET` | `/api/v1/documents/:id` | Autenticado | Obtiene los metadatos de un documento por su ID. |
| `GET` | `/api/v1/documents/:id/download` | Propietario / `admin` | Descarga el archivo binario correspondiente al documento. |
| `DELETE` | `/api/v1/documents/:id` | `admin` | Elimina atómicamente el documento de la base y del disco. |

### Mocks y Simulación (`/mocks`)
*En entorno de producción, estos endpoints exigen la cabecera `x-internal-token`.*
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mocks/mockingusers` | Operación interna | Genera 50 usuarios simulados en memoria sin persistir en BD. |
| `GET` | `/api/mocks/mockingorders` | Operación interna | Genera 50 pedidos simulados en memoria sin persistir en BD. |
| `POST` | `/api/v1/mocks/generateData` | Operación interna | Siembra en base de datos la cantidad indicada de usuarios y pedidos. |
| `POST` | `/api/v1/mocks/users` | Operación interna | Siembra usuarios simulados en la base de datos. |
| `POST` | `/api/v1/mocks/couriers` | Operación interna | Siembra repartidores simulados en la base de datos. |
| `POST` | `/api/v1/mocks/orders` | Operación interna | Siembra pedidos simulados vinculados a usuarios existentes. |
| `POST` | `/api/v1/mocks/deliveries` | Operación interna | Siembra entregas simuladas vinculadas a pedidos y repartidores. |
| `POST` | `/api/v1/mocks/full` | Operación interna | Siembra integralmente todas las entidades relacionadas. |
| `DELETE` | `/api/v1/mocks` | Operación interna | Limpia todos los documentos de las 4 colecciones de la BD. |

### Salud y Diagnóstico (`/health` & `/logger`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Público | Devuelve estado, uptime, entorno, versión y timestamp. |
| `GET` | `/api/v1/health/ready` | Público | Sondeo de readiness contra MongoDB (200 OK / 503 Not Ready). |
| `GET` | `/loggerTest` | Público | Emite trazas de prueba en los 6 niveles de Winston (`/api/loggerTest`). |
| `GET` | `/api/v1/logger/recent` | `admin` | Consulta las últimas líneas del archivo de log general. |
| `GET` | `/api/v1/logger/error-lines` | `admin` | Consulta las líneas del archivo de errores. |

---

## Licencia

Este proyecto está bajo la Licencia MIT. Consulte el archivo [LICENSE](LICENSE) para más detalles.
