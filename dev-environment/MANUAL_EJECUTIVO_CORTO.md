# Manual Ejecutivo Corto - Aplicacion de Gestion de Entregas

Fecha: 16 de febrero de 2026

## 1. Proposito
La aplicacion permite gestionar clientes, direcciones, reservas y la configuracion operativa de entregas, con control por roles y sesion activa.

## 2. Acceso y sesion
- URL: `http://localhost:3000`
- Login por email.
- Ejemplos para revision:
  - Buyer: `pedro.perez@mail.com`
  - Admin: `mgonza@mmmm.cc`

Reglas de sesion:
- Solo una sesion activa por customer.
- Vigencia de sesion: 5 minutos.
- Si no existe sesion valida, redireccion a Login.

## 3. Roles y permisos
## Buyer
- Acceso a:
  - Gestion de Clientes
  - Mi Detalle de Cliente
  - Direcciones de Entrega
  - Reservas
- Sin acceso a modulos administrativos.

## Admin
- Acceso total al sistema.
- Puede operar modulos administrativos:
  - Gestion de Rangos de Tiempo
  - Gestion de Ventanas de Entrega
  - Gestion de Zonas de Cobertura

## 4. Navegacion global
En todas las vistas excepto Login:
- Session-bar con customer activo y boton **Cerrar sesion**.
- Quick-actions globales.
- Opciones administrativas visibles solo para Admin.

## 5. Modulos clave
## Clientes
- CRUD completo de customers.

## Detalle del Cliente
- Vista central de operacion por customer.
- Incluye:
  - CRUD de direcciones (con seleccion en mapa)
  - CRUD de reservas

## Rangos de Tiempo (Admin)
- CRUD de franjas horarias.
- Regla: hora fin > hora inicio.

## Ventanas de Entrega (Admin)
- CRUD de slots con fecha, costo y capacidad.
- Validaciones de capacidad y cantidad reservada.

## Zonas de Cobertura (Admin)
- CRUD con poligono en mapa (`boundary`) y centroide (`location`).

## 6. Reglas de negocio criticas de reservas
Al crear/editar reservas:
1. La direccion debe pertenecer al customer.
2. La direccion debe pertenecer a una zona del mismo delivery slot.
3. Fecha/hora de reserva dentro de la fecha/rango del slot.
4. La capacidad del delivery slot debe estar disponible.

Adicional:
- `reserved_count` del delivery slot se sincroniza automaticamente con reservas confirmadas.

## 7. Beneficio operativo
- Control de acceso por perfil y sesion activa.
- Consistencia operacional entre direccion, zona, horario y capacidad.
- Trazabilidad simple para administracion diaria de entregas.
