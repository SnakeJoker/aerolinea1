document.addEventListener("DOMContentLoaded", () => {
	const initializeMap = () => {
		if (!map) {
			const mapContainer = document.getElementById("map");
			mapContainer.style.boxShadow = "none"; // Desactivar sombras en el contenedor del mapa

			map = L.map(mapContainer, {
				preferCanvas: true, // Usar lienzo en lugar de SVG para mejorar el rendimiento
				zoomControl: false, // Desactivar control de zoom predeterminado de Leaflet
			}).setView([0, 0], 2);

			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "© OpenStreetMap contributors",
				detectRetina: true, // Detectar pantalla Retina para mejorar el rendimiento
				noWrap: true, // Desactivar repetición del mapa para mejorar el rendimiento
			}).addTo(map);
		}

		return map;
	};

	let map;
	let mostrarResultado;

	const checkSession = () => {
		const currentPage = window.location.pathname.split("/").pop();
		const username = localStorage.getItem("username");

		if (currentPage === "add_flight.html" && !username) {
			window.location.href = "login.html";
		}
	};

	const login = () => {
		const username = document.getElementById("username").value;
		const password = document.getElementById("password").value;

		fetch("/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }),
		})
			.then((response) => response.text())
			.then((message) => {
				alert(message);
				if (message === "Inicio de sesión exitoso.") {
					localStorage.setItem("username", username);
					const loginForm = document.getElementById("loginForm");
					const userContainer = document.getElementById("user-container");
					const usernameDisplay = document.getElementById("username-display");

					loginForm.style.display = "none";
					userContainer.style.display = "block";
					usernameDisplay.innerText = username;
					window.location.href = "index.html";
				}
			})
			.catch((error) => {
				console.error("Error al iniciar sesión:", error);
			});
	};

	const logout = () => {
		localStorage.removeItem("username");
		const loginForm = document.getElementById("loginForm");
		const userContainer = document.getElementById("user-container");
		const usernameDisplay = document.getElementById("username-display");

		loginForm.style.display = "block";
		userContainer.style.display = "none";
		usernameDisplay.innerText = "";
	};

	const register = () => {
		const newUsername = document.getElementById("newUsername").value;
		const newPassword = document.getElementById("newPassword").value;

		fetch("/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username: newUsername, password: newPassword }),
		})
			.then((response) => response.text())
			.then((message) => {
				alert(message);
			})
			.catch((error) => {
				console.error("Error al registrar usuario:", error);
			});
	};

	buscarVuelo = () => {
		const numeroVuelo = document.getElementById("numero_vuelo").value;

		// Obtener el host actual (dominio)
		const currentHost = window.location.host;

		// Hacer una solicitud AJAX al servidor
		fetch(`http://${currentHost}/buscarVuelo?numero_vuelo=${numeroVuelo}`)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error: ${response.status} - ${response.statusText}`);
				}
				return response.json();
			})
			.then((vuelo) => {
				mostrarResultado(vuelo);
			})
			.catch((error) => {
				console.error("Error al buscar vuelo:", error.message);
				alert("Error al buscar vuelo. Consulta la consola para más detalles.");
			});
	};

	mostrarResultado = (vuelo) => {
		const resultadoDiv = document.getElementById("resultadoVuelo");
	
		resultadoDiv.innerHTML = "";
	
		if (vuelo) {
			resultadoDiv.innerHTML += `<p>Número de Vuelo: ${vuelo.numero_vuelo}</p>`;
			resultadoDiv.innerHTML += `<p>Origen: ${vuelo.origen}</p>`;
			resultadoDiv.innerHTML += `<p>Destino: ${vuelo.destino}</p>`;
	
			// Formato de las horas de salida y llegada
			const formatoFecha = (fecha) => {
				const options = {
					hour: "numeric",
					minute: "numeric",
					second: "numeric",
					day: "numeric",
					month: "numeric",
					year: "numeric"
				};
	
				return new Date(fecha).toLocaleString("es-ES", options);
			};
	
			const fechaSalidaObj = new Date(vuelo.hora_salida);
			const fechaLlegadaObj = new Date(vuelo.hora_llegada);
			const fechaActualObj = new Date();
	
			const horaSalidaFormateada = formatoFecha(fechaSalidaObj);
			const horaLlegadaFormateada = formatoFecha(fechaLlegadaObj);
			const horaActualFormateada = formatoFecha(fechaActualObj);
	
			console.log(horaSalidaFormateada);
			console.log(horaLlegadaFormateada);
			console.log(horaActualFormateada);
	
			resultadoDiv.innerHTML += `<p>Hora de Salida: ${horaSalidaFormateada}</p>`;
			resultadoDiv.innerHTML += `<p>Hora de Llegada: ${horaLlegadaFormateada}</p>`;
	
			resultadoDiv.innerHTML += `<p>Escalas: ${vuelo.escalas}</p>`;
	
			// Calcula el tiempo total y el tiempo transcurrido
			const tiempoTotal = fechaLlegadaObj - fechaSalidaObj;
			const tiempoTranscurrido = fechaActualObj - fechaSalidaObj;
	
			// Calcula el porcentaje transcurrido
			const porcentajeTranscurrido = (tiempoTranscurrido / tiempoTotal) * 100;
	
			// Crea la barra de carga
			const progressBar = document.createElement("div");
			progressBar.classList.add("progress-bar");
			resultadoDiv.appendChild(progressBar);
	
			// Crea la etiqueta de porcentaje
			const percentageLabel = document.createElement("p");
			percentageLabel.textContent = `Progreso del Vuelo: ${porcentajeTranscurrido.toFixed(2)}%`;
			resultadoDiv.appendChild(percentageLabel);
	
			// Actualiza el ancho de la barra de carga
			progressBar.style.width = `${porcentajeTranscurrido}%`;
	
			// Agrega clases según la etapa del vuelo
			if (porcentajeTranscurrido < 10) {
				progressBar.classList.add("early-departure");
			} else if (porcentajeTranscurrido < 70) {
				progressBar.classList.add("on-the-way");
			} else if (porcentajeTranscurrido < 95) {
				progressBar.classList.add("approaching");
			} else {
				progressBar.classList.add("arrived");
			}
		} else {
			resultadoDiv.innerHTML = "<p>No se encontraron datos para el vuelo.</p>";
		}
	};
	

	const updateMap = (map, flights) => {
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker) {
				map.removeLayer(layer);
			}
		});

		flights.forEach((flight) => {
			if (flight[6] && flight[5]) {
				const marker = L.marker([flight[6], flight[5]], {
					riseOnHover: false, // Desactivar elevación al pasar el ratón
				})
					.bindPopup(
						`<b>${flight[1] || "Desconocido"}</b><br>Origen - Destino: ${
							flight[2] || "Desconocido"
						} - ${flight[4] || "Desconocido"}<br>Última Actualización: ${new Date(
							flight[11] * 1000
						).toLocaleString()}`
					)
					.addTo(map);
			}
		});
	};

	const fetchFlights = () => {
		return fetch("https://opensky-network.org/api/states/all")
			.then((response) => {
				if (response.status === 429) {
					throw new Error(
						"Demasiadas solicitudes a la API. Por favor, espere y vuelva a intentarlo."
					);
				} else if (!response.ok) {
					throw new Error(
						`Error en la solicitud: ${response.status} - ${response.statusText}`
					);
				}

				return response.json();
			})
			.catch((error) => {
				console.error("Error al obtener datos de vuelos:", error.message);
			});
	};

	const displayFlights = (data) => {
		const flightListContainer = document.getElementById("flightList");
		const map = initializeMap();

		if (data && data.states && data.states.length > 0) {
			const flightsByCountry = data.states.reduce((acc, flight) => {
				const country = flight[2] || "Desconocido";
				acc[country] = acc[country] || [];
				acc[country].push(flight);
				return acc;
			}, {});

			Object.keys(flightsByCountry).forEach((country) => {
				const flightsForCountry = flightsByCountry[country];
				const quarterCount = Math.ceil(flightsForCountry.length * 0.7);
				const selectedFlights = flightsForCountry.slice(0, quarterCount);

				selectedFlights.forEach((flight) => {
					const flightCard = document.createElement("div");
					flightCard.classList.add("flightCard");

					const flightName = document.createElement("h2");
					flightName.textContent = flight[1] || "Desconocido";

					const originDestination = document.createElement("p");
					originDestination.textContent = `Origen - Destino: ${
						flight[2] || "Desconocido"
					} - ${flight[4] || "Desconocido"}`;

					const arrivalTime = document.createElement("p");
					arrivalTime.textContent = `Última Actualización: ${new Date(
						flight[11] * 1000
					).toLocaleString()}`;

					flightCard.appendChild(flightName);
					flightCard.appendChild(originDestination);
					flightCard.appendChild(arrivalTime);

					flightListContainer.appendChild(flightCard);
				});

				updateMap(map, selectedFlights);
			});
		} else {
			console.error("Datos de vuelos no válidos o vacíos.");
		}
	};

	const searchFlight = () => {
		const flightNumber = document.getElementById("flightSearch").value;

		fetch("/search-flight", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ flightNumber }),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data && data.length > 0) {
					displaySearchResults(data);
				} else {
					alert("Vuelo no encontrado en la base de datos.");
				}
			})
			.catch((error) => {
				console.error("Error al buscar vuelo:", error);
			});
	};

	const displaySearchResults = (data) => {
		const searchResultContainer = document.getElementById("searchResult");

		searchResultContainer.innerHTML = "";

		if (data && data.length > 0) {
			data.forEach((flight) => {
				const flightCard = document.createElement("div");
				flightCard.classList.add("flightCard");

				const flightName = document.createElement("h2");
				flightName.textContent = flight.numero_vuelo || "Desconocido";

				const originDestination = document.createElement("p");
				originDestination.textContent = `Origen - Destino: ${
					flight.origen || "Desconocido"
				} - ${flight.destino || "Desconocido"}`;

				const departureArrival = document.createElement("p");
				departureArrival.textContent = `Salida: ${new Date(
					flight.hora_salida
				).toLocaleString()} - Llegada: ${new Date(
					flight.hora_llegada
				).toLocaleString()}`;

				const layovers = document.createElement("p");
				layovers.textContent = `Escala(s): ${flight.escalas || "Ninguna"}`;

				flightCard.appendChild(flightName);
				flightCard.appendChild(originDestination);
				flightCard.appendChild(departureArrival);
				flightCard.appendChild(layovers);

				searchResultContainer.appendChild(flightCard);
			});
		} else {
			console.error("Datos de vuelos no válidos o vacíos.");
		}
	};

	const addFlight = () => {
		const flightNumber = document.getElementById("flightNumber").value;
		const origin = document.getElementById("origin").value;
		const destination = document.getElementById("destination").value;
		const departureTime = document.getElementById("departureTime").value;
		const arrivalTime = document.getElementById("arrivalTime").value;
		const layovers = document.getElementById("layovers").value;

		fetch("/add_flight", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				flightNumber,
				origin,
				destination,
				departureTime,
				arrivalTime,
				layovers,
			}),
		})
			.then((response) => response.text())
			.then((message) => {
				alert(message);
			})
			.catch((error) => {
				console.error("Error al agregar el vuelo", error);
			});
	};

	window.searchFlight = searchFlight;
	window.addFlight = addFlight;
	window.login = login;
	window.register = register;
	window.logout = logout;

	checkSession();

	const mapContainer = document.getElementById("map");
	const flightListContainer = document.getElementById("flightList");

	fetchFlights().then(displayFlights);
});
