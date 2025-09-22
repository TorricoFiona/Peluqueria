class SistemaPeluqueria {
    constructor() {
        this.turnos = JSON.parse(localStorage.getItem('turnos')) || [];
        this.clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        this.nextId = parseInt(localStorage.getItem('nextId')) || 1;

        this.servicios = {
            corte: { nombre: 'Corte de Cabello', precio: 15, duracion: 30 },
            lavado: { nombre: 'Lavado y Peinado', precio: 10, duracion: 45 },
            tintura: { nombre: 'Tintura', precio: 35, duracion: 120 },
            permanente: { nombre: 'Permanente', precio: 45, duracion: 180 },
            alisado: { nombre: 'Alisado', precio: 50, duracion: 150 },
            tratamiento: { nombre: 'Tratamiento Capilar', precio: 25, duracion: 60 }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDateLimits();
        this.loadTurnos();
        this.loadClientes();
        this.updateStats();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        document.getElementById('turnoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.crearTurno();
        });

        document.getElementById('filtroFecha').addEventListener('change', () => {
            this.loadTurnos();
        });

        document.getElementById('filtroEstado').addEventListener('change', () => {
            this.loadTurnos();
        });

        document.getElementById('buscarCliente').addEventListener('input', (e) => {
            this.buscarClientes(e.target.value);
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.cerrarModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalTurno')) {
                this.cerrarModal();
            }
        });
    }

    setupDateLimits() {
        const fechaInput = document.getElementById('fecha');
        const today = new Date().toISOString().split('T')[0];
        fechaInput.min = today;

        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        fechaInput.max = maxDate.toISOString().split('T')[0];
    }

    switchSection(sectionName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        if (sectionName === 'turnos') {
            this.loadTurnos();
            this.updateStats();
        } else if (sectionName === 'clientes') {
            this.loadClientes();
        }
    }

    crearTurno() {
        const formData = new FormData(document.getElementById('turnoForm'));
        const turnoData = {
            id: this.nextId++,
            cliente: formData.get('cliente'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            servicio: formData.get('servicio'),
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            notas: formData.get('notas'),
            estado: 'confirmado',
            fechaCreacion: new Date().toISOString()
        };

        if (!this.validarHorarioDisponible(turnoData.fecha, turnoData.hora)) {
            this.mostrarNotificacion('El horario seleccionado no está disponible', 'error');
            return;
        }

        this.turnos.push(turnoData);
        this.actualizarCliente(turnoData);
        this.guardarDatos();
        document.getElementById('turnoForm').reset();
        this.mostrarNotificacion('Turno reservado exitosamente');
        this.loadTurnos();
        this.updateStats();
    }

    validarHorarioDisponible(fecha, hora) {
        return !this.turnos.some(turno => turno.fecha === fecha && turno.hora === hora && turno.estado !== 'cancelado');
    }

    actualizarCliente(turnoData) {
        let cliente = this.clientes.find(c => c.telefono === turnoData.telefono);

        if (cliente) {
            cliente.nombre = turnoData.cliente;
            cliente.email = turnoData.email;
            cliente.ultimaVisita = turnoData.fecha;
            cliente.totalTurnos++;
        } else {
            this.clientes.push({
                nombre: turnoData.cliente,
                telefono: turnoData.telefono,
                email: turnoData.email,
                fechaRegistro: new Date().toISOString(),
                ultimaVisita: turnoData.fecha,
                totalTurnos: 1
            });
        }
    }

    guardarDatos() {
        localStorage.setItem('turnos', JSON.stringify(this.turnos));
        localStorage.setItem('clientes', JSON.stringify(this.clientes));
        localStorage.setItem('nextId', this.nextId.toString());
    }

    loadTurnos() {
        const filtroFecha = document.getElementById('filtroFecha').value;
        const filtroEstado = document.getElementById('filtroEstado').value;

        let turnosFiltrados = this.turnos;

        if (filtroFecha) {
            turnosFiltrados = turnosFiltrados.filter(turno => turno.fecha === filtroFecha);
        }

        if (filtroEstado) {
            turnosFiltrados = turnosFiltrados.filter(turno => turno.estado === filtroEstado);
        }

        turnosFiltrados.sort((a, b) => {
            const dateA = new Date(`${a.fecha}T${a.hora}`);
            const dateB = new Date(`${b.fecha}T${b.hora}`);
            return dateA - dateB;
        });

        const container = document.getElementById('listaTurnos');
        if (turnosFiltrados.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay turnos que mostrar</p>';
            return;
        }

        container.innerHTML = turnosFiltrados.map(turno => this.generarTarjetaTurno(turno)).join('');
    }

    generarTarjetaTurno(turno) {
        const servicio = this.servicios[turno.servicio];
        const fechaFormateada = new Date(turno.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="turno-card" data-id="${turno.id}">
                <div class="turno-header">
                    <div class="turno-cliente">${turno.cliente}</div>
                    <div class="turno-estado estado-${turno.estado}">${turno.estado}</div>
                </div>
                <div class="turno-info">
                    <div class="turno-detalle"><span>📅</span><span>${fechaFormateada}</span></div>
                    <div class="turno-detalle"><span>🕒</span><span>${turno.hora}</span></div>
                    <div class="turno-detalle"><span>✂️</span><span>${servicio.nombre}</span></div>
                    <div class="turno-detalle"><span>💰</span><span>$${servicio.precio}</span></div>
                    <div class="turno-detalle"><span>📞</span><span>${turno.telefono}</span></div>
                    ${turno.notas ? `<div class="turno-detalle" style="grid-column: 1/-1;"><span>📝</span><span>${turno.notas}</span></div>` : ''}
                </div>
                <div class="turno-acciones">
                    <button class="btn-small btn-editar" onclick="sistema.editarTurno(${turno.id})">Editar</button>
                    ${turno.estado === 'confirmado' ? `
                        <button class="btn-small btn-completar" onclick="sistema.completarTurno(${turno.id})">Completar</button>
                        <button class="btn-small btn-cancelar" onclick="sistema.cancelarTurno(${turno.id})">Cancelar</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    completarTurno(id) {
        const turno = this.turnos.find(t => t.id === id);
        if (turno) {
            turno.estado = 'completado';
            this.guardarDatos();
            this.loadTurnos();
            this.updateStats();
            this.mostrarNotificacion('Turno completado');
        }
    }

    cancelarTurno(id) {
        const turno = this.turnos.find(t => t.id === id);
        if (turno) {
            turno.estado = 'cancelado';
            this.guardarDatos();
            this.loadTurnos();
            this.updateStats();
            this.mostrarNotificacion('Turno cancelado');
        }
    }

    editarTurno(id) {
        const turno = this.turnos.find(t => t.id === id);
        if (!turno) return;

        const form = document.getElementById('turnoForm');
        form.cliente.value = turno.cliente;
        form.telefono.value = turno.telefono;
        form.email.value = turno.email;
        form.servicio.value = turno.servicio;
        form.fecha.value = turno.fecha;
        form.hora.value = turno.hora;
        form.notas.value = turno.notas || '';

        this.cancelarTurno(id);
        this.switchSection('nuevoTurno');
        this.mostrarNotificacion('Edita el turno y vuelve a guardarlo');
    }

    loadClientes() {
        const container = document.getElementById('listaClientes');
        container.innerHTML = this.clientes.map(cliente => `
            <div class="cliente-card">
                <h4>${cliente.nombre}</h4>
                <p><strong>📞</strong> ${cliente.telefono}</p>
                <p><strong>📧</strong> ${cliente.email}</p>
                <p><strong>🗓️ Última visita:</strong> ${cliente.ultimaVisita}</p>
                <p><strong>🔁 Turnos totales:</strong> ${cliente.totalTurnos}</p>
            </div>
        `).join('');
    }

    buscarClientes(texto) {
        const container = document.getElementById('listaClientes');
        const resultados = this.clientes.filter(cliente =>
            cliente.nombre.toLowerCase().includes(texto.toLowerCase())
        );

        if (resultados.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No se encontraron clientes</p>';
            return;
        }

        container.innerHTML = resultados.map(cliente => `
            <div class="cliente-card">
                <h4>${cliente.nombre}</h4>
                <p><strong>📞</strong> ${cliente.telefono}</p>
                <p><strong>📧</strong> ${cliente.email}</p>
                <p><strong>🗓️ Última visita:</strong> ${cliente.ultimaVisita}</p>
                <p><strong>🔁 Turnos totales:</strong> ${cliente.totalTurnos}</p>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.turnos.length;
        const confirmados = this.turnos.filter(t => t.estado === 'confirmado').length;
        const completados = this.turnos.filter(t => t.estado === 'completado').length;
        const cancelados = this.turnos.filter(t => t.estado === 'cancelado').length;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statConfirmados').textContent = confirmados;
        document.getElementById('statCompletados').textContent = completados;
        document.getElementById('statCancelados').textContent = cancelados;
    }

    mostrarNotificacion(mensaje, tipo = 'success') {
        const notif = document.getElementById('notificacion');
        notif.textContent = mensaje;
        notif.className = `notificacion ${tipo}`;
        notif.style.display = 'block';
        setTimeout(() => {
            notif.style.display = 'none';
        }, 3000);
    }

    cerrarModal() {
        document.getElementById('modalTurno').style.display = 'none';
    }
}

const sistema = new SistemaPeluqueria();
