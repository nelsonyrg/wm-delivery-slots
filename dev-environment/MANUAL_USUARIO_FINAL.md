# Manual de Usuario Final - Aplicacion de Gestion de Entregas

Fecha: 2026-02-16

## 1. Objetivo
Este manual explica como usar la aplicacion para:
- Gestionar clientes.
- Gestionar direcciones de entrega.
- Gestionar reservas.
- Gestionar rangos de tiempo, ventanas de entrega y zonas de cobertura (solo Admin).

## 2. Acceso al sistema
1. Abrir la aplicacion en `http://localhost:3000`.
2. Ingresar correo en la vista **Inicio de Sesion**.
3. Presionar **Iniciar sesion**.

Correos de revision disponibles:
- Buyer: `pedro.perez@mail.com`
- Admin: `mgonza@mmmm.cc`

## 3. Perfiles y permisos
### Buyer
- Al iniciar sesion, se redirige automaticamente a **Detalle del Cliente**.
- Puede usar:
  - Gestion de Clientes.
  - Mi Detalle.
  - Direcciones de entrega.
  - Reservas.
- No puede ver ni entrar a:
  - Gestion de Rangos de Tiempo.
  - Gestion de Ventanas de Entrega.
  - Gestion de Zonas de Cobertura.

### Admin
- Al iniciar sesion, se redirige automaticamente a **Inicio**.
- Puede usar todos los modulos del sistema.

## 4. Reglas de sesion activa
- Solo puede existir **una sesion activa por customer**.
- Si intenta iniciar sesion un customer que ya tiene sesion activa, se muestra:
  - `Usuario ya tiene una sesion activa`
- El tiempo de vigencia de sesion es de **5 minutos**.
- Si no hay sesion activa valida, el sistema redirige a **Inicio de Sesion**.
- El boton **Cerrar sesion** esta disponible en la barra superior (excepto en Login).

## 5. Navegacion global
En todas las vistas (excepto Login) se muestran:
- **Session-bar** con nombre, correo, tipo de customer y boton **Cerrar sesion**.
- **Quick-actions** para navegar rapido.

Quick-actions visibles para todos:
- Ir al Inicio
- Ir a Gestion de Clientes
- Ir a Mi Detalle

Quick-actions solo para Admin:
- Ir a Gestion de Rangos de Tiempo
- Ir a Gestion de Ventanas de Entrega
- Ir a Gestion de Zonas de Cobertura

## 6. Modulos funcionales

## 6.1 Inicio
Muestra:
- Estado del sistema (Backend, Base de Datos, PostGIS).
- Stack tecnologico.
- Accesos rapidos (quick-actions).

## 6.2 Gestion de Clientes
Permite:
- Crear cliente.
- Editar cliente.
- Eliminar cliente.
- Ver detalle de cliente.

Campos principales:
- Nombre completo
- Email
- Telefono
- Tipo (`BUYER` o `ADMIN`)

Nota:
- Desde Login se puede entrar a **Registro de clientes** para alta inicial.

## 6.3 Detalle del Cliente
Muestra:
- Datos del cliente.
- Gestion de **Reservas**.
- Gestion de **Direcciones de Entrega**.

## 6.4 Direcciones de Entrega
Permite CRUD completo.

Datos principales:
- Calle, localidad, region, ciudad, comuna, codigo postal.
- Opcion de direccion por defecto.
- Ubicacion en mapa (click para seleccionar punto).

Regla importante:
- El punto debe estar dentro de una zona de cobertura activa.

## 6.5 Reservas
Permite CRUD completo dentro de **Detalle del Cliente**.

Datos principales:
- Direccion de entrega
- Ventana de entrega
- Fecha de reserva
- Hora de reserva
- Estado (`CONFIRMED`, `CANCELLED`, `EXPIRED`)

Validaciones de negocio:
1. La direccion debe pertenecer al customer.
2. La direccion debe pertenecer a una zona asociada al mismo delivery slot.
3. La fecha de reserva debe coincidir con la fecha del delivery slot.
4. La hora debe estar dentro del rango del time slot template del delivery slot.
5. Debe existir capacidad disponible en el delivery slot.

Comportamiento de capacidad:
- El sistema actualiza automaticamente `reserved_count` del delivery slot segun reservas confirmadas.

## 6.6 Gestion de Rangos de Tiempo (Solo Admin)
Permite CRUD de rangos horarios.

Campos:
- Hora inicio
- Hora fin
- Estado

Validacion:
- La hora de fin debe ser mayor a la hora de inicio.

## 6.7 Gestion de Ventanas de Entrega (Solo Admin)
Permite CRUD de ventanas de entrega.

Campos:
- TimeSlotTemplate
- Fecha de entrega
- Costo de entrega
- Capacidad maxima
- Cantidad reservada
- Estado

Validaciones:
- Costo >= 0
- Capacidad maxima >= 0
- Cantidad reservada >= 0
- Cantidad reservada <= Capacidad maxima

## 6.8 Gestion de Zonas de Cobertura (Solo Admin)
Permite CRUD de zonas con mapa.

Campos:
- Nombre, region, ciudad, comuna, localidad, codigo postal.
- Ventana de entrega asociada.
- Capacidad maxima.
- Estado.
- Poligono en mapa.

Uso del mapa:
1. Hacer click para agregar puntos.
2. Minimo 3 puntos para poligono valido.
3. Usar botones:
   - Deshacer ultimo punto
   - Limpiar poligono

Comportamiento espacial:
- `boundary` guarda el poligono.
- `location` guarda el centroide representativo de la zona.

## 7. Flujo recomendado (Admin)
1. Crear/validar Rangos de Tiempo.
2. Crear Ventanas de Entrega usando esos rangos.
3. Crear Zonas de Cobertura y asociarlas a ventanas.
4. Registrar clientes.
5. Registrar direcciones de entrega.
6. Registrar reservas.

## 8. Flujo recomendado (Buyer)
1. Iniciar sesion con email.
2. Revisar **Mi Detalle**.
3. Registrar direccion de entrega valida en mapa.
4. Crear reserva para la direccion y ventana disponible.
5. Editar o cancelar reserva cuando sea necesario.

## 9. Mensajes frecuentes
- `Usuario ya tiene una sesion activa`
- `La hora de fin debe ser mayor a la hora de inicio`
- `Debes seleccionar una ubicacion en el mapa`
- `La direccion seleccionada no pertenece a una zona del delivery_slot seleccionado`
- `La fecha de reserva debe coincidir con la fecha de la Ventana de Entrega seleccionada`
- `No hay capacidad disponible en la Ventana de Entrega seleccionada`

## 10. Cierre de sesion
- Usar boton **Cerrar sesion** en la barra superior.
- Al cerrar sesion, el sistema vuelve a Login.
- Si la sesion expira, tambien redirige a Login.
