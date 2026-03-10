# Database - MongoDB

Configuración y scripts de base de datos para TuCreditoOnline.

## 📊 Estructura

```
database/
├── init/              # Scripts de inicialización
│   └── init-db.js     # Crear colecciones e índices
├── migrations/        # Scripts de migración
├── seeds/            # Datos de prueba
└── backups/          # Scripts de respaldo
```

## 🗄️ Colecciones Principales

Las colecciones se crearán según las Historias de Usuario:
- users
- credits
- payments
- documents
- audit_logs

## 🔐 Seguridad

- Autenticación habilitada
- Roles y permisos configurados
- Conexiones encriptadas en producción

## 📝 Convenciones

- Nombres de colecciones en plural y minúsculas
- Campos en camelCase
- Timestamp fields: `createdAt`, `updatedAt`
- Soft deletes con campo `deletedAt`

## 🚀 Inicialización

Los scripts en `init/` se ejecutan automáticamente al crear el contenedor.
