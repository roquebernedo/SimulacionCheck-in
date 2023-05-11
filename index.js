import express from "express";
import mysql from "mysql"

const app = express()

const db = mysql.createConnection({
    host: "mdb-test.c6vunyturrl6.us-west-1.rds.amazonaws.com",
    user: "bsale_test",
    password: "bsale_test",
    database: "airline",
})

app.get("/flights/:id/passengers", async (req,res)=>{
    
  const flightId = req.params.id

  const q = `SELECT * FROM flight WHERE flight_id = ?`;
   
  db.query(q, [flightId], (err,dataVuelos)=>{
      if(err){    
          const errorRespuesta = {
              code: 400,
              errors: "could not connect to db"
          }
          return res.status(400).json(errorRespuesta)
      }else if(dataVuelos.length === 0){
          const valorNoEncotnrado = {
              code: 404,
              data: {}
          }
          return res.status(404).json(valorNoEncotnrado)
      }else{
          const flight = dataVuelos[0]
          const passengers = []
              
          const q2 = `SELECT passenger.passenger_id, passenger.dni, passenger.name, passenger.age, passenger.country,
          boarding_pass.boarding_pass_id, boarding_pass.purchase_id, boarding_pass.seat_type_id, boarding_pass.seat_id
          FROM boarding_pass JOIN airline.passenger ON boarding_pass.passenger_id = passenger.passenger_id WHERE boarding_pass.flight_id = ?;`
           
          db.query(q2, [flightId], (err,dataPasajeros)=>{
              if(err){
                  const response = {
                      code: 404,
                      data: {}
                  }
                  return res.json(err)
              }else{
                  dataPasajeros.forEach((passenger)=>{
                      passengers.push({
                          passengerId: passenger.passenger_id,
                          dni: passenger.dni,
                          name: passenger.name,
                          age: passenger.age,
                          country: passenger.country,
                          boardingPassId: passenger.boarding_pass_id,
                          purchaseId: passenger.purchase_id,
                          seatTypeId: passenger.seat_type_id,
                          seatId: passenger.seat_id,
                      })
                  })
                
                  const asientosEco = []
                  const q3 = "SELECT * FROM airline.seat WHERE seat_type_id = 3 and airplane_id = 1";
                  db.query(q3, (err, data) => {
                    if (err) return res.json(err);
                      data.forEach((datos)=>{
                        asientosEco.push(datos.seat_id)
                      })
                      const asientosEconomicos = asignarAsientos(passengers,flight, asientosEco)                
                  });

                 

                  const assignedPassengers = asignarAsientos(passengers, flight, asientosEco);

                  const response = {
                      code: 200,
                      data: {
                          flightId: flight.flight_id,
                          takeoffDateTime: flight.takeoff_date_time,
                          takeoffAirport: flight.takeoff_airport,
                          landingDateTime: flight.landing_date_time,
                          landingAirport: flight.landing_airport,
                          airplaneId: flight.airplane_id,
                          passengers: assignedPassengers,
                      }
                  }   

                  return res.status(200).json(response)
              }
          })
      }
  })
})

function asignarAsientos(passengers, flight, asientosEco, numRows, numColumns) {
  const asientosTotal = (flight.flight_id === 1 || flight.flight_id === 4) ? 160 : 155;
  const numPassengers = passengers.length;
  const assignedPassengers = [];
  const usedSeats = [];
  const compra = []
  // Asientos ocupados desde el inicio, mas no despues de la asignacion
  for(let i=0; i<numPassengers; i++){
    if(passengers[i].seatId !== null){
      usedSeats.push(passengers[i].seatId)
    }
  }

  // Purchase_Id ordenados
   for(let i=0; i< numPassengers; i++){
     compra[i] = {id: passengers[i].purchaseId}
   }
   // Tarjetas de embarque ordenadas por su compra
   for(let i=0; i< numPassengers; i++){
     compra[i].boardingPass =  passengers.filter(pad => pad.purchaseId === passengers[i].purchaseId).map(pad => pad.boardingPassId)
   }
   
  const titi = []

  // Asientos de la tarjeta de embarque ordenada por sus clases
  for(let i=0; i< compra.length; i++){
    const boardingPasses = compra[i].boardingPass
    const titi2 = []
    for(let j=0; j< boardingPasses.length; j++){
      const boardingPass = passengers.find(pad => pad.boardingPassId === boardingPasses[j])
      titi2.push(boardingPass.seatTypeId)
    }
    titi.push(titi2)
  }

  for(let i=0; i< compra.length; i++){
    compra[i].seatType = titi[i]
  }
  
  // PUNTO 1 ---------------------------------------------------------------------------------------------------

  // Filtrar la lista de pasajeros para obtener solo aquellos menores de edad
  const pasajerosMenorEdad = passengers.filter(passenger => passenger.age < 18);
  
  // Agrupar los pasajeros por el id de la compra a la que pertenecen
  const pasajerosTarjEmbarId = pasajerosMenorEdad.reduce((acc, passenger) => {
    if (!acc[passenger.purchaseId]) {
      acc[passenger.purchaseId] = [];
    }
    acc[passenger.purchaseId].push(passenger);
    return acc;
  }, {});

  // Para cada grupo de pasajeros, encontrar al menos un acompañante mayor de edad
  const pasajerosConAdul = Object.values(pasajerosTarjEmbarId).map(passengers => {
    const adultPassenger = passengers.filter(passenger => passenger.age >= 18);
    return passengers.map(passenger => {
      passenger.adultSeatId = adultPassenger.seatId;
      return passenger;
    });
  }).flat();

  // Asignar los asientos correspondientes a los pasajeros menores de edad junto a sus acompañantes mayores de edad
  const assignedPassengersWithAdult = assignedPassengers.map(passenger => {
  if (passenger.age < 18) {
    passenger.seatId = passenger.adultSeatId;
  }
  //return passenger;
  });


  // PUNTO 2 ---------------------------------------------------------------------------------------------------

  // Matriz para saber que columna es 
  const columnas = ["A", "B", "C", "E", "F", "G"]

  const purchase = {
    numBoardingPasses: 0,
    assignedSeats: [],
  };

  const asientosUsados = purchase.assignedSeats
  
  let assignedSeat = null
  const ultimoAsienAsignado = purchase.assignedSeats[purchase.numBoardingPasses - 1]

  // Si hay un asiento asignado anteriormente(de una persona dentro de la misma compra), buscar asientos cercanos
  if(ultimoAsienAsignado !== null){
    let lastRow 
    let lastCol
    //const availableSeatsMatrix = createAvailableSeatsMatrix(passengers.seatTypeId, numRows, numColumns, availableSeats)

    // Busca asientos en las filas anteriores y desde las ultimas filas
    for(let row = lastRow - 1; row >= 0; row--){

      assignedSeat = buscarAsienDisponible(asientosUsados, row, lastCol)
      if(assignedSeat !== null){
        break;
      }

      // Busca asientos en la misma fila
      if(assignedSeat === null){
        assignedSeat = buscarAsienDisponible(asientosUsados, lastRow, lastCol)
      }

      // Busca asientos en filas posteriores
      if(assignedSeat === null){
        for (let row = lastRow + 1; row < numRows; row++) {
          assignedSeat = buscarAsienDisponible(asientosUsados, row, lastCol);
          if (assignedSeat !== null){
            break;
          }
        }

      }

      // Por ultimo caso si no se encuentra asiento cercano, asignar uno aleatorio
      if(assignedSeat === null){
        do {
          assignedSeat = Math.floor(Math.random() * (numRows * numColumns)) + 1
        } while (asientosUsados.includes(assignedSeat))
      }
      return assignedSeat
  }
}
  // Obtener un asiento por su ID
  const obtenerAsientoId = (row, col) => {
    return row * numColumns + col + 1;
  }

  // Matriz que busca los asientos disponibles contando las filas y columnas

  const buscarAsienDisponible = (availableSeatsMatrix, asientosUsados, row, col) => {
    if (availableSeatsMatrix[row][col] && !asientosUsados.includes(obtenerAsientoId(row, col))) {
      return obtenerAsientoId(row, col);
    } else if (col > 0) {
      return buscarAsienDisponible(availableSeatsMatrix, asientosUsados, row, col - 1);
    } else {
      return null;
    }
  }
  
  // Matriz de asientos disponibles para el tipo de pasajeros

  const createAvailableSeatsMatrix = (seatType, asientosUsados) =>{
    const availableSeatsMatrix = [];
  
    for (let i = 0; i < numRows; i++) {
      availableSeatsMatrix[i] = [];
      for (let j = 0; j < numColumns; j++) {
        const seatId = obtenerAsientoId(i, j);
        if (seatId[seatType].includes(seats[seatId].type) && !asientosUsados.includes(seatId)) {
          availableSeatsMatrix[i][j] = true;
        } else {
          availableSeatsMatrix[i][j] = false;
        }
      }
    }
    //return availableSeatsMatrix;
  }

  // PUNTO 3 -----------------------------------------------------------------------------------------------------------
  // Asientos economicos
  const Economicos = []
  for(let i=0; i < asientosEco.length; i++){
    Economicos.push(asientosEco[i])
  }

  let asientoRandom
  // Recorre todos los pasajeros
  for(let i=0; i< numPassengers; i++){

    do {
      asientoRandom = Math.floor(Math.random() * asientosTotal) + 1;
    } while (usedSeats.includes(asientoRandom))

    // Las tarjetas de embarque de clase economica, solo se asignaran en asientos de clase economica
    if(passengers[i].seatId === null && passengers[i].seatTypeId === 3){
      const passenger = passengers[i]
      let asignarRandomEco
      do{
        asignarRandomEco = Math.floor(Math.random() * asientosTotal) + 1
      }while (!Economicos.includes(asignarRandomEco) && usedSeats.includes(asignarRandomEco))
      const assignedPassenger = {
        ...passenger, 
        seatId: asignarRandomEco
      }
      usedSeats.push(asignarRandomEco)
      const indiceRandom = Economicos.indexOf(asignarRandomEco)
      Economicos.splice(indiceRandom, 1)
      assignedPassengers.push(assignedPassenger)

    // Aca si el asiento esta vacio se le asigna un asiento y se le agrega al array, si el asiento esta ocupado solo se le agrega al array
    }else if(passengers[i].seatId == null){
      const passenger = passengers[i]
      const assignedPassenger = {
        ...passenger, 
        seatId: asientoRandom,
      }
      usedSeats.push(asientoRandom)
      assignedPassengers.push(assignedPassenger)

    }else{
      const passenger = passengers[i]
      const assignedPassenger = {
        ...passenger,
      }
      assignedPassengers.push(assignedPassenger)
    }
  }
  return assignedPassengers;
}

app.listen(8800, () =>{
    console.log("Conectado al backend")
})
