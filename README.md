# Battiolab ERP

Sistema de escritorio para Battiolab, empresa de venta y reparación de vehículos eléctricos. Gestiona ventas, inventario (con lotes y escáner de códigos), clientes y empleados.

## Módulos

| Módulo | Pantallas |
| --- | --- |
| Inicio | Ingresos del mes, carga del inventario, ventas recientes y lo más vendido |
| Ventas | Facturas, nueva venta (contado o crédito, consumidor final), por cobrar (cartera por antigüedad), reportes y configuración |
| Inventario | Existencias, alertas de stock, catálogo con imágenes, lotes recibidos y escaneo de códigos |
| Clientes | Lista, grupos (mejores, recurrentes, nuevos, sin actividad), historial con facturas y reportes |
| Empleados | Lista, departamentos, reportes de nómina y antigüedad, retiros, cargos y áreas |
| Empresa | Datos del emisor, resolución de facturación DIAN, pie de factura, UVT y salario mínimo |

Reglas de negocio:

- **Facturación:** cada venta emite una factura con los requisitos del art. 617 del E.T. y del art. 11 de la Resolución DIAN 000165 de 2023 que dependen del sistema: emisor con NIT y DV, calidad tributaria, resolución con prefijo, rango y vigencia, adquirente (o consumidor final 222222222222), detalle con unidad de medida, IVA discriminado por tarifa, total en letras, forma y medio de pago. Battiolab no transmite a la DIAN: el CUFE, la firma y el QR los asigna un proveedor tecnológico.
- **Numeración:** con resolución registrada se usa su prefijo y rango, y no se factura fuera del rango ni con la resolución vencida.
- **Las facturas no se editan ni se borran:** se anulan con nota crédito (con motivo y consecutivo propio) y el inventario se repone.
- **IVA por producto:** 19 %, 5 % o excluido. El precio puede escribirse con IVA incluido; la factura desagrega la base para que el total sea exacto.
- **Inventario:** vender descuenta stock y no permite vender sin existencias, salvo que se active en Configuración de ventas. Los lotes suman stock y todo queda en el historial de movimientos.
- **Clientes y empleados no se eliminan:** los clientes se desactivan; a los empleados se les registra el retiro. Los productos con ventas o lotes se descontinúan.
- **Validaciones colombianas:** cédula (6 a 10 dígitos), NIT de 9 dígitos con dígito de verificación automático, teléfonos de 10 dígitos (celular 3xx o fijo 601 a 608), SKU en mayúsculas.
- La primera cuenta registrada es administradora. Solo los administradores cambian la configuración.

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
| `UPLOAD_DIR` | Opcional. Carpeta de las imágenes de productos (por defecto `server/uploads`) |

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

Electron, React 18, TypeScript, Material UI 5, Recharts, Express, Mongoose y JWT. Tipografías Archivo y Figtree incluidas en la app.

## Licencia

ISC
