# SimulacionCheck-in
Simulacion Check-in Aerolinea - Se consultara los vuelos(id) por lo cual retornara un check-in con los asientos asignados Antes de ejecutar esta aplicación, asegúrate de tener instaladas las siguientes dependencias:

- Node.js
- Nodemon
- Express
- MySQL
Si no tienes Node.js instalado en tu computadora, puedes descargarlo desde su sitio web oficial. Una vez que hayas instalado Node.js, puedes instalar las otras dependencias usando el siguiente comando:

$ npm install nodemon express mysql

Una vez que hayas instalado todas las dependencias, puedes ejecutar la aplicación usando el comando:

$ npm start

Este comando iniciará el servidor y tu aplicación estará lista para recibir solicitudes.

# Solucion

- Primero creamos la API utilizando Express, para luego conectarnos a la base de datos de Bsale_testm, tendra como endpoint "/flights/:id/passengers", varia de acuerdo a los vuelos( 1 o 2 o 3 o 4 )
- La funcion asignarAsientos sera la funcion con la que le daremos funcionalidad a la API, la funcion se encargara de asignar asientos a los pasajeros, para eso usaremos un bucle "for" para recorrer una serie de pasajeros y asignarles los asientos.
- Debemos de tener en cuenta de que no se le asignara un asiento al azar a los pasajeros, sino que se le asignara de acuerdo a su clase de asiento, para eso ejecutamos un bucle "do-while" para generar un asiento aleatorio hasta que se encuentre un asiento que no haya sido utilizado previamente y que se encuentre dentro de los asientos de sus clases respectivas, estas condiciones se cumpliran con las clases economica, economica premium y primera clase, en caso cumplan con las restricciones se le asignara el asiento.
- Algunos arrays con los que nos podemos apoyar sera el array "usedSeats" con el que sabremos en un inicio que asientos estan ocupados, el array "assignedPassengers" con el cual almacenaremos los asientos asignados y "asientosTotal" que sera de ayuda para saber cuantos asientos hay en cada avion.
- Para que un pasajero menor de edad logre tener un asiento al costado de un acompañante se hara lo siguiente, tendremos que filtrar la lista de pasajeros para obtener solo los menores de edad, agrupar los pasajeros por el id de la compra que pertenecen, iterar a través de cada grupo de pasajeros y, para cada grupo, iterar a través de los pasajeros menores de edad, para cada pasajero menor de edad, podemos buscar a sus acompañantes mayores de edad y asegurarnos de que estén sentados al lado del pasajero menor de edad, si los acompañantes mayores de edad ya tienen asientos asignados, podemos intentar cambiar el asiento del pasajero menor de edad para que esté al lado de ellos, si no tienen asientos asignados, podemos asignar asientos juntos para que estén sentados al lado del pasajero menor de edad, asi es como lograremos colocar un pasajero menor de edad junto con un acompañante.
- Para que los pasajeros con una misma compra queden cercanos, debemos buscar asientos que estén cerca los unos de los otros, podemos hacer esto buscando filas que tengan varios asientos disponibles, y luego asignando los asientos a los pasajeros en la misma fila, también podríamos buscar asientos contiguos en columnas adyacentes, nos ayudaremos sabiendo cual fue el ultimo asiento asignado de la compra, para eso guardaremos esa informacion en una variable, tendremos una matriz la cual tendra el total de las columnas, como tambien una matriz que busque los asientos disponibles contando filas y columnas
- El endpoint "/flights/:id/passengers" el cual se podra consultar por su id de vuelo, para eso se coloco una variable que agarra el id dependiendo de que vuelo quieras, adentro del primer query en caso aparezcan errores se mostrataran una de las 2 puestas y si todo esta bien, mostrara la informacion desplegada, aca hacemos tres llamados a la base de datos para obtener los datos necesarios para poder realizar las restricciones de la asignacion de asientos.
- Para terminar llamamos en el servidor 8800 y lo conectamos.

# Disclaimer

Este es un proyecto de prueba para validar la funcionalidad de un Check-in, no esta listo para la produccion ya que faltan muchos detalles y esto es solo una parte, si alguien estaria dispuesto a contribuir las partes restantes, es decir si gustaria apoyar, estaria encantado.

# Error

En caso el deploy no funcione lo cual espero que no ocurra, dejare un mensaje por aca ya que seria una pena que eso pasase, aqui esta toda la informacion requerida de todas formas.
