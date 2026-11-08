# Battiolab ERP

Sistema de escritorio para Battiolab, empresa de venta y reparación de vehículos eléctricos. Gestiona ventas, inventario (con lotes y escáner de códigos), clientes y empleados.

## Módulos

| Módulo | Pantallas |
| --- | --- |
| Inicio | Ingresos del mes, carga del inventario, ventas recientes y lo más vendido |
| Ventas | Lista con filtros, nueva venta tipo punto de venta, reportes y configuración (impuesto, numeración, métodos de pago) |
| Inventario | Existencias, alertas de stock, catálogo, lotes recibidos y escaneo de códigos |
| Clientes | Lista, grupos (mejores, recurrentes, nuevos, sin actividad), historial de compras y reportes |
| Empleados | Lista, departamentos, reportes de nómina y antigüedad, configuración de cargos y áreas |

Reglas de negocio importantes:

- Registrar una venta descuenta el stock; anularla o eliminarla lo repone. No se puede vender sin stock salvo que se active en Configuración de ventas.
- Registrar un lote suma sus unidades al stock. Cada entrada o salida queda en el historial de movimientos del producto.
- La primera cuenta registrada es administradora. Solo los administradores pueden eliminar registros y cambiar la configuración.

## Requisitos

- Node.js 18 o superior
- MongoDB 6 o superior corriendo localmente (o una URI remota)

## Instalación

```bash
git clone https://github.com/bfailach/Battiolab.git
cd Battiolab
npm install
npm install --prefix server
cp server/.env.example server/.env   # y edita JWT_SECRET
```

Variables de `server/.env`:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del API (por defecto 3006) |
| `MONGODB_URI` | Conexión a MongoDB |
| `JWT_SECRET` | Clave para firmar las sesiones. Usa una cadena larga y aleatoria |
| `SITE_CODE` | Opcional. Si se define, el registro exige este código de sede |
| `CORS_ORIGINS` | Opcional. Orígenes permitidos separados por comas |

## Uso local

Con MongoDB encendido:

```bash
npm run app   # compila la interfaz y abre la app (uso diario)
npm run dev   # modo desarrollo: recarga al guardar cambios
```

Ambos levantan también el API en `http://localhost:3006`. Cierra la ventana o presiona `Ctrl+C` en la terminal para detener todo.

## Pruebas y calidad

```bash
npm test        # pruebas de API y Electron
npm run lint
npm run build   # build de producción en build/
```

## Tecnologías

Electron, React 18, TypeScript, Material UI 5, Recharts, Express, Mongoose y JWT.

## Licencia

ISC
