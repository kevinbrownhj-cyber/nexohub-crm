# NexoHub CRM - Frontend

Frontend React profesional para el sistema de gestión de casos de grúa.

## 🚀 Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Estilos utility-first
- **React Router** - Navegación
- **TanStack Query** - Data fetching y cache
- **React Hook Form + Zod** - Formularios y validación
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── layouts/        # Layouts (DashboardLayout)
│   └── ProtectedRoute.tsx
├── contexts/           # Contextos de React
│   └── AuthContext.tsx # Autenticación global
├── lib/               # Utilidades
│   ├── api.ts         # Cliente Axios configurado
│   └── utils.ts       # Funciones helper
├── pages/             # Páginas de la aplicación
│   ├── auth/          # Login
│   ├── dashboard/     # Dashboard con KPIs
│   ├── cases/         # Gestión de casos
│   ├── surcharges/    # Recargos pendientes
│   ├── billing/       # Facturación
│   ├── users/         # Gestión de usuarios
│   ├── profile/       # Perfil de usuario
│   ├── audit/         # Auditoría
│   └── imports/       # Importaciones
├── types/             # Tipos TypeScript
│   └── index.ts       # Interfaces del dominio
├── App.tsx            # Configuración de rutas
├── main.tsx           # Entry point
└── index.css          # Estilos globales
```

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Login con email/password
- Refresh token automático
- Guards de rutas protegidas
- Logout con limpieza de tokens

### ✅ Dashboard
- KPIs principales (casos activos, recargos, facturación)
- Gráficos de casos por estado
- Resumen visual del sistema

### ✅ Gestión de Casos
- Lista paginada con filtros
- Búsqueda por expediente/cliente
- Filtro por estado
- Detalle completo del caso
- Notas y timeline
- Acciones (asignar, cambiar estado)

### ✅ Módulos Adicionales
- Recargos pendientes de aprobación
- Casos listos para facturar
- Lista de facturas
- Gestión de usuarios
- Perfil y cambio de contraseña
- Logs de auditoría
- Historial de importaciones

### ✅ UX Profesional
- Sidebar responsive con navegación
- Loading states
- Estados vacíos
- Manejo de errores
- Permisos por rol
- Mobile-friendly

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🌐 URLs

- **Frontend:** http://localhost:5173
- **API Backend:** http://localhost:3000/api
- **Swagger:** http://localhost:3000/docs

## 🔐 Credenciales de Prueba

```
Admin:       admin@nexohub.com       / Admin123!
Supervisor:  supervisor@nexohub.com  / Super123!
Técnico:     tecnico@nexohub.com     / Tecnico123!
Facturación: facturacion@nexohub.com / Factura123!
```

## 📝 Flujo de Uso

1. **Login** en http://localhost:5173/login
2. **Dashboard** - Ver resumen del sistema
3. **Casos** - Gestionar casos de servicio
4. **Recargos** - Aprobar/rechazar recargos
5. **Facturación** - Crear y emitir facturas
6. **Usuarios** - Administrar usuarios (solo admin)
7. **Auditoría** - Ver logs de cambios

## 🔄 Integración con Backend

El frontend se conecta automáticamente al backend en `http://localhost:3000/api` mediante:

- **Axios interceptor** para agregar token JWT
- **Refresh automático** cuando el access token expira
- **Proxy de Vite** para evitar CORS en desarrollo

## 🎨 Personalización

### Colores
Editar `tailwind.config.js`:
```js
colors: {
  primary: {
    500: '#0ea5e9', // Color principal
    600: '#0284c7',
    // ...
  }
}
```

### API URL
Editar `vite.config.ts`:
```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000', // URL del backend
    }
  }
}
```

## 📦 Próximas Implementaciones

- [ ] Formularios completos para crear/editar casos
- [ ] Modal de asignación de técnicos
- [ ] Modal de cambio de estado con validaciones
- [ ] Formulario de recargos con evidencia
- [ ] Creación de facturas con selección de casos
- [ ] Exportación de facturas a Excel
- [ ] Upload de archivos de importación
- [ ] Preview de importaciones
- [ ] Filtros avanzados en todas las listas
- [ ] Gráficos interactivos en dashboard
- [ ] Notificaciones en tiempo real
- [ ] Dark mode

## 🐛 Troubleshooting

### El frontend no conecta con el backend
- Verificar que el backend esté corriendo en puerto 3000
- Revisar la configuración del proxy en `vite.config.ts`

### Error de CORS
- El proxy de Vite debería resolver esto automáticamente
- Verificar que `CORS_ORIGINS` en el backend incluya `http://localhost:5173`

### Tokens no se guardan
- Verificar que el backend devuelva `accessToken` y `refreshToken` en el login
- Revisar la consola del navegador para errores

## 📄 Licencia

Proyecto privado - NexoHub CRM
