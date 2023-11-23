/*

Evaluativo nro. 4
Cátedra: Simulación de Sistemas
Alumno: Manuel Paz, Albany Pérez y Miguel Coronel
Sección: N-1113

*/

// Variables globales para la simulación
var viaAuxiliar = 0;
var registro_viaAuxiliar = Array();
var registro_embotellamientos = Array();

// Función asincrónica para generar la simulación
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function generarSimulacion(
  momentoSimulacion,
  fechaConclusion,
  intervaloEvaluacion = 20,
  tipoSimulacion = 1,
  tiempoIntervalo = 200
) {
  // Inicialización de variables para la simulación
  viaAuxiliar = 0;
  registro_viaAuxiliar = Array();
  registro_embotellamientos = Array();

  // Limpiar los reportes en la interfaz
  document.getElementById("reporteEmbotellamiento").innerHTML = "";
  document.getElementById("reporteAuxiliar").innerHTML = "";

  // Validar que la fecha de inicio no sea posterior a la fecha de conclusión
  if (fechaConclusion.getTime() < momentoSimulacion.getTime()) {
    alert("La fecha de Inicio no puede ser posterior a fecha de Conclusion.");
    return;
  }

  // Bucle principal de la simulación
  while (fechaConclusion.getTime() >= momentoSimulacion.getTime()) {
    // Evaluación de las condiciones de tráfico en ambas vías
    var datosEvaluacion_NorSur = evaluacionVia(momentoSimulacion, 1);
    var datosEvaluacion_SurNor = evaluacionVia(momentoSimulacion, 2);

    // Inicialización de variables relacionadas con la vía auxiliar
    var traficoAuxiliar = 0;

    // Cierre de la vía auxiliar si no hay tráfico en ambas vías principales
    if (
      datosEvaluacion_NorSur.densidadMomento == 0 &&
      datosEvaluacion_SurNor.densidadMomento == 0 &&
      viaAuxiliar !== 0
    ) {
      viaAuxiliar = 0;
      traficoAuxiliar = 0;
      // Registro del evento de cierre de la vía auxiliar
      var eventoVia = {
        tipoEvento: "Cerrado",
        momentoSimulacion: momentoSimulacion,
        sentidoEvento: viaAuxiliar,
      };
      registro_viaAuxiliar.push(eventoVia);
    }

    // Densidad máxima permitida
    var densidadMaxima = 126;

    // Generación de datos aleatorios para la densidad de la vía Norte-Sur
    datosEvaluacion_NorSur.arrayKilometros = generarAleatorio(
      densidadMaxima,
      datosEvaluacion_NorSur.densidadMomento - 1
    );

    // Repartir densidad en la vía auxiliar si está habilitada
    if (viaAuxiliar == 1) {
      datosEvaluacion_NorSur.arrayKilometros = repartirDensidad(
        datosEvaluacion_NorSur.arrayKilometros
      );
    }

    // Generación de datos aleatorios para la densidad de la vía Sur-Norte
    datosEvaluacion_SurNor.arrayKilometros = generarAleatorio(
      densidadMaxima,
      datosEvaluacion_SurNor.densidadMomento
    );

    // Repartir densidad en la vía auxiliar si está habilitada
    if (viaAuxiliar == 2) {
      datosEvaluacion_SurNor.arrayKilometros = repartirDensidad(
        datosEvaluacion_SurNor.arrayKilometros
      );
    }

    // Toma de decisiones sobre el tráfico y eventos de la vía auxiliar
    decidirTransito(
      datosEvaluacion_NorSur,
      datosEvaluacion_SurNor,
      momentoSimulacion
    );

    // Generar interfaz gráfica para representar la simulación
    generarFront(
      momentoSimulacion,
      datosEvaluacion_NorSur,
      datosEvaluacion_SurNor,
      viaAuxiliar,
      traficoAuxiliar
    );

    // Esperar el intervalo de tiempo antes de la siguiente evaluación
    await timer(tiempoIntervalo);

    // Avanzar en el tiempo según el intervalo de evaluación
    momentoSimulacion = new Date(
      momentoSimulacion.getTime() + intervaloEvaluacion * 60 * 1000
    );
  }

  // Generar reportes finales de la simulación
  reporteAuxiliar(registro_viaAuxiliar);
  reporteEmbotellamientos(registro_embotellamientos);
}

// Función para evaluar el tráfico en una vía en un momento dado
function evaluacionVia(momentoSimulacion, sentidoVia) {
  // Definición de las horas pico según el día de la semana y el sentido de la vía
  var horasPico;
  var diaSimulacion = momentoSimulacion.getDay();

  if (diaSimulacion > 0 && diaSimulacion < 6) {
    horasPico = sentidoVia === 1
      ? [[[6, 0], [9, 0], 119], [[11, 30], [13, 0], 105], [[17, 0], [19, 30], 120]]
      : [[[6, 0], [9, 0], 117], [[11, 30], [13, 0], 98], [[17, 0], [21, 15], 76]];
  } else {
    horasPico = sentidoVia === 1
      ? [[[13, 0], [15, 0], 107], [[18, 0], [20, 0], 80]]
      : [[[7, 0], [9, 30], 105], [[16, 30], [22, 0], 54]];
  }

  // Inicialización de variables
  var densidadRetorno = 0;
  var horasPicoRetorno = Array();

  // Evaluación de la densidad en el momento actual
  horasPico.forEach((horaPico) => {
    var horaInicio = new Date(
      momentoSimulacion.getFullYear(),
      momentoSimulacion.getMonth(),
      momentoSimulacion.getDate()
    );
    horaInicio.setHours(horaPico[0][0]);
    horaInicio.setMinutes(horaPico[0][1]);
    horaInicio.setSeconds(0);

    var horaFin = new Date(
      momentoSimulacion.getFullYear(),
      momentoSimulacion.getMonth(),
      momentoSimulacion.getDate()
    );
    horaFin.setHours(horaPico[1][0]);
    horaFin.setMinutes(horaPico[1][1]);
    horaFin.setSeconds(0);

    horasPicoRetorno.push([horaInicio, horaFin]);

    if (
      momentoSimulacion.getTime() >= horaInicio.getTime() &&
      momentoSimulacion.getTime() < horaFin.getTime()
    ) {
      densidadRetorno = horaPico[2];
    }
  });

  // Datos de retorno
  var datosRetorno = {
    horasPico: horasPicoRetorno,
    densidadMomento: densidadRetorno,
    via: sentidoVia,
  };

  return datosRetorno;
}

// Función para tomar decisiones sobre el tráfico y la vía auxiliar
function decidirTransito(viaEvaluar1, viaEvaluar2, momentoSimulacion) {
  // Conteo de embotellamientos en ambas vías principales
  var embotellamientos_via1 = contarEmbotellamientos(
    viaEvaluar1,
    momentoSimulacion
  );
  var embotellamientos_via2 = contarEmbotellamientos(
    viaEvaluar2,
    momentoSimulacion
  );

  var viaEscogida = null;

  // Elección de la vía con más embotellamientos
  if (
    embotellamientos_via1 == embotellamientos_via2 &&
    embotellamientos_via1 !== 0
  ) {
    viaEscogida = viaEvaluar1;
    viaEscogida.embotellamientos = embotellamientos_via1;
  }

  if (embotellamientos_via1 > embotellamientos_via2) {
    viaEscogida = viaEvaluar1;
    viaEscogida.embotellamientos = embotellamientos_via1;
  } else if (embotellamientos_via1 < embotellamientos_via2) {
    viaEscogida = viaEvaluar2;
    viaEscogida.embotellamientos = embotellamientos_via2;
  }

  // Apertura de la vía auxiliar si es necesario
  if (viaEscogida !== null) {
    if (viaAuxiliar == 0) {
      if (viaEscogida.densidadMomento !== 0) {
        viaAuxiliar = viaEscogida.via;
        // Registro del evento de apertura de la vía auxiliar
        evento_viaAuxiliar = {
          tipoEvento: "Apertura",
          momentoSimulacion: momentoSimulacion,
          detallesEvento: viaEscogida,
        };
        registro_viaAuxiliar.push(evento_viaAuxiliar);
      }
    }
  }
}

// Función para contar los embotellamientos en una vía
function contarEmbotellamientos(viaEvaluar, momentoSimulacion) {
  var vigilanteKilometro = 0;
  var contadorEmbotellamientos = 0;

  // Iterar sobre los kilómetros de la vía y contar embotellamientos
  viaEvaluar.arrayKilometros.forEach((kilometroDensidad) => {
    if (kilometroDensidad >= 125) {
      var embotellamiento = {
        momentoSimulacion: momentoSimulacion,
        viaCuestion: viaEvaluar.via,
        numeroVehiculos: kilometroDensidad,
        kilometroResponsable: vigilanteKilometro,
      };

      // Registro del embotellamiento
      registro_embotellamientos.push(embotellamiento);
      contadorEmbotellamientos++;
    }
    vigilanteKilometro++;
  });

  return contadorEmbotellamientos;
}

// Función para redistribuir la densidad en la vía auxiliar
function repartirDensidad(viaRepatir) {
  for (let index = 0; index < viaRepatir.length; index++) {
    viaRepatir[index] = Math.trunc((viaRepatir[index] * 3) / 5);
  }

  return viaRepatir;
}

// Función para generar un array de números aleatorios
function generarAleatorio(max, min) {
  var arrayAleatorios = Array(12);

  for (let index = 0; index <= arrayAleatorios.length - 1; index++) {
    arrayAleatorios[index] = Math.trunc(Math.random() * (max - min) + min);
  }

  return arrayAleatorios;
}

// Función para generar la representación gráfica de una vía en la interfaz
function generarVia(datosEvaluacion, lista_id) {
  var listaRellenar = document.getElementById(lista_id);
  listaRellenar.innerHTML = "";

  // Generar elementos de la lista con la densidad de cada kilómetro
  datosEvaluacion.arrayKilometros.forEach((kilometroDensidad) => {
    let textoDensidad = document.createTextNode(kilometroDensidad);
    let itemDensidad = document.createElement("li");

    itemDensidad.appendChild(textoDensidad);

    // Resaltar en rojo los kilómetros con densidad mayor o igual a 125
    if (kilometroDensidad >= 125) {
      itemDensidad.style.color = "red";
      itemDensidad.style.fontWeight = "bold";
    }

    listaRellenar.appendChild(itemDensidad);
  });
}

// Función para generar la interfaz gráfica de la simulación
function generarFront(
  momentoSimulacion,
  via1,
  via2,
  viaAuxiliar,
  traficoAuxiliar
) {
  // Actualizar el reloj de la simulación
  var relojSimulacion = document.getElementById("reloj");
  relojSimulacion.innerHTML = "";
  var textoReloj = document.createTextNode(momentoSimulacion);
  relojSimulacion.appendChild(textoReloj);

  // Generar la representación gráfica de las vías en la interfaz
  generarVia(via1, "via1");
  generarVia(via2, "via2");

  // Etiquetas de horas pico en las vías principales
  let label1Pico = document.getElementById("picoNS");
  label1Pico.innerHTML = "";

  let label2Pico = document.getElementById("picoSN");
  label2Pico.innerHTML = "";

  // Etiquetas de horas pico solo si hay densidad en las vías principales
  if (via1.densidadMomento > 0) {
    label1Pico.style.color = "red";
    let labelTexto = document.createTextNode("Hora Pico");
    label1Pico.appendChild(labelTexto);
  }

  if (via2.densidadMomento > 0) {
    label2Pico.style.color = "red";
    let labelTexto = document.createTextNode("Hora Pico");
    label2Pico.appendChild(labelTexto);
  }

  // Indicación del estado de la vía auxiliar
  var direccionAuxiliar = document.getElementById("direccionAuxiliar");
  direccionAuxiliar.innerHTML = "";
  var direccionAuxiliarTexto;

  // Texto según el estado de la vía auxiliar
  if (viaAuxiliar == 0) {
    direccionAuxiliarTexto = document.createTextNode("Via Auxiliar Cerrada");
  }

  if (viaAuxiliar == 1) {
    direccionAuxiliarTexto = document.createTextNode(
      "Via Auxiliar habilitada, Sentido Norte-Sur"
    );
  }

  if (viaAuxiliar == 2) {
    direccionAuxiliarTexto = document.createTextNode(
      "Via Auxiliar habilitada, Sentido Sur-Norte"
    );
  }

  direccionAuxiliar.appendChild(direccionAuxiliarTexto);
}

// Función para iniciar la simulación con los parámetros proporcionados
function iniciarSimulacion() {
  // Obtener los datos de inicio y fin de la simulación desde la interfaz
  var momentoInicio = {
    fechaInicio: document.getElementById("fechaInicio").value,
    inicioHora: parseInt(document.getElementById("inicioHora").value),
    inicioMins: parseInt(document.getElementById("inicioMins").value),
  };

  var momentoFin = {
    fechaFin: document.getElementById("fechaFin").value,
    finHora: parseInt(document.getElementById("finHora").value),
    finMins: parseInt(document.getElementById("finMins").value),
  };

  // Validar la entrada de datos
  if (
    momentoInicio.fechaInicio == "" ||
    isNaN(momentoInicio.inicioHora) == true
  ) {
    alert("Datos de inicio incompletos o incorrectos");
    return;
  }

  if (momentoFin.fechaFin == "" || isNaN(momentoFin.finHora) == true) {
    alert("Datos de fin incompletos o incorrectos");
    return;
  }

  if (momentoInicio.inicioHora > 23 || momentoInicio.inicioMins > 59) {
    alert("La hora de inicio no es válida");
    return;
  }

  // Crear la fecha de inicio
  var fechaInicioParts = momentoInicio.fechaInicio.split("/");
  var inicioSimulacion = new Date(
    [fechaInicioParts[1], fechaInicioParts[0], fechaInicioParts[2]].join("/")
  );
  inicioSimulacion.setHours(momentoInicio.inicioHora);
  if (isNaN(momentoInicio.inicioMins) == true) {
    momentoInicio.inicioMins = 0;
  }
  inicioSimulacion.setMinutes(momentoInicio.inicioMins);

  if (momentoFin.finHora > 23 || momentoFin.finMins > 59) {
    alert("La hora de fin no es válida");
    return;
  }

  // Crear la fecha de fin
  var fechaFinParts = momentoFin.fechaFin.split("/");
  var finSimulacion = new Date(
    [fechaFinParts[1], fechaFinParts[0], fechaFinParts[2]].join("/")
  );
  finSimulacion.setHours(momentoFin.finHora);
  if (isNaN(momentoFin.finMins) == true) {
    momentoFin.finMins = 0;
  }
  finSimulacion.setMinutes(momentoFin.finMins);

  // Iniciar la simulación con las fechas proporcionadas
  generarSimulacion(inicioSimulacion, finSimulacion);
}

// Función para generar el reporte de embotellamientos
function reporteEmbotellamientos(registro_embotellamientos) {
  var reportesDIV = document.getElementById("reporteEmbotellamiento");

  // Iterar sobre los embotellamientos registrados y generar reportes
  registro_embotellamientos.forEach((embotellamiento) => {
    var reporte = document.createElement("h6");
    var reporteTexto =
      "Via: " +
      embotellamiento.viaCuestion +
      ", Numero de vehiculos: " +
      embotellamiento.numeroVehiculos +
      ", Kilometro: " +
      embotellamiento.kilometroResponsable +
      ", Fecha: " +
      embotellamiento.momentoSimulacion.getDate() +
      "/" +
      (embotellamiento.momentoSimulacion.getMonth() + 1) +
      "/" +
      embotellamiento.momentoSimulacion.getFullYear() +
      ", Hora: " +
      embotellamiento.momentoSimulacion.getHours() +
      ":" +
      embotellamiento.momentoSimulacion.getMinutes();
    reporteTexto = document.createTextNode(reporteTexto);
    reporte.appendChild(reporteTexto);
    reportesDIV.appendChild(reporte);
  });
}

// Función para generar el reporte de eventos de la vía auxiliar
function reporteAuxiliar(registro_viaAuxiliar) {
  var reportesDIV = document.getElementById("reporteAuxiliar");

  // Iterar sobre los eventos de la vía auxiliar y generar reportes
  registro_viaAuxiliar.forEach((evento) => {
    var reporte = document.createElement("h6");
    if (evento.detallesEvento) {
      var reporteTexto =
        evento.tipoEvento +
        ", Sentido: " +
        evento.detallesEvento.via +
        ", Fecha: " +
        evento.momentoSimulacion.getDate() +
        "/" +
        (evento.momentoSimulacion.getMonth() + 1) +
        "/" +
        evento.momentoSimulacion.getFullYear() +
        ", Hora: " +
        evento.momentoSimulacion.getHours() +
        ":" +
        evento.momentoSimulacion.getMinutes();
    } else {
      var reporteTexto =
        evento.tipoEvento +
        ", Fecha: " +
        evento.momentoSimulacion.getDate() +
        "/" +
        (evento.momentoSimulacion.getMonth() + 1) +
        "/" +
        evento.momentoSimulacion.getFullYear() +
        ", Hora: " +
        evento.momentoSimulacion.getHours() +
        ":" +
        evento.momentoSimulacion.getMinutes();
    }
    reporteTexto = document.createTextNode(reporteTexto);
    reporte.appendChild(reporteTexto);
    reportesDIV.appendChild(reporte);
  });
}