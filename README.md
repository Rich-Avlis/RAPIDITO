# RAPIDITO 🏍️

Plataforma de transporte que conecta pasajeros con conductores en Venezuela.

## Características Principales

- **Registro y Autenticación** con OTP vía SMS
- **Perfiles** de pasajero y conductor
- **Mapas** con OpenStreetMap + Leaflet
- **Solicitudes de viaje** con cálculo de tarifa en tiempo real
- **Negociación** de tarifas entre pasajero y conductor
- **Seguimiento en tiempo real** del conductor
- **Pagos** en efectivo y PagoMóvil
- **Calificaciones** bidireccionales
- **Documentación** con captura guiada
- **Billetera** del conductor con comisiones
- **Dashboard administrativo** con métricas en tiempo real

## Stack Tecnológico

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de datos:** PostgreSQL + Prisma ORM
- **Mapas:** OpenStreetMap + OSRM
- **Tiempo real:** Socket.IO (próximamente)
- **Almacenamiento:** S3 compatible (próximamente)

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd rapidito

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar cliente Prisma
npx prisma generate

# Crear migraciones
npx prisma migrate dev

# Sembrar datos de desarrollo (opcional)
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

## Estructura del Proyecto

```
rapidito/
├── src/
│   ├── app/              # Pages and API routes
│   │   ├── api/          # API endpoints
│   │   ├── admin/        # Admin dashboard
│   │   ├── driver/       # Driver views
│   │   └── passenger/    # Passenger views
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities and helpers
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   └── providers/        # React contexts
├── prisma/               # Database schema
└── public/               # Static assets
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Rides
- `POST /api/rides` - Request a ride
- `GET /api/rides` - Get rides history
- `POST /api/rides/negotiation` - Create negotiation
- `PATCH /api/rides/negotiation` - Respond to negotiation

### Drivers
- `GET /api/drivers/nearby` - Find nearby drivers
- `PUT /api/drivers/location` - Update driver location
- `PUT /api/drivers/status` - Toggle online status

### Payments
- `POST /api/payments` - Process payment

### Ratings
- `POST /api/ratings` - Submit rating

### Wallet
- `GET /api/wallet` - Get wallet info
- `POST /api/wallet` - Request withdrawal

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents` - Get documents

### Admin
- `GET /api/admin/stats` - Get dashboard stats

## Fases de Desarrollo

### FASE 1 - MVP ✅
- [x] Registro y Login
- [x] Autenticación con OTP
- [x] Perfiles de usuario
- [x] Geolocalización
- [x] Cálculo de tarifa
- [x] Solicitud de viaje
- [x] Negociación
- [x] Conductores cercanos
- [x] Pagos
- [x] Calificaciones
- [x] Documentación con captura guiada
- [x] Wallet y comisiones
- [x] Dashboard administrativo

### FASE 2 - Próximamente
- [ ] Tiempo real con Socket.IO
- [ ] Sistema de puntos
- [ ] Referidos
- [ ] Promociones
- [ ] Notificaciones push

### FASE 3 - Futuro
- [ ] Integraciones de pago automatizadas
- [ ] Llamadas enmascaradas
- [ ] Sistema antifraude
- [ ] Expansión a otras ciudades

## Licencia

Propietario - Todos los derechos reservados.
