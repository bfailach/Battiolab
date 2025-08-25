# Battiolab ERP

Sistema ERP de escritorio para la gestión de Battiolab, empresa dedicada a la venta y reparación de vehículos eléctricos.

## Características principales

- Gestión de clientes
- Gestión de empleados
- Control de inventario
- Sistema de ventas
- Autenticación y autorización de usuarios
- Interfaz moderna y responsive

## Requisitos previos

- Node.js (v14 o superior)
- npm (v6 o superior)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/battiolab/erp.git
cd erp
```

2. Instalar dependencias:
```bash
npm install
```

## Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

Esto iniciará:
- El servidor de desarrollo de React en http://localhost:3000
- La aplicación Electron que se conectará al servidor de desarrollo

## Construcción

Para construir la aplicación para producción:

```bash
npm run build
```

## Estructura del proyecto

```
battiolab-erp/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── clients/
│   │   ├── employees/
│   │   ├── inventory/
│   │   └── sales/
│   ├── App.tsx
│   └── main.js
├── package.json
└── tsconfig.json
```

## Tecnologías utilizadas

- Electron
- React
- TypeScript
- Material-UI
- React Router

## Licencia

ISC 