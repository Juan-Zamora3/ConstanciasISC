// Eventos.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card } from '../components/Card';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig'; 
import { doc, updateDoc } from 'firebase/firestore';
// O si ya tienes un "app" y "db" exportado, ajusta la importación según tu caso
// import { app, db } from '../firebaseConfig';

// Inicializar (si no lo has hecho en otro lugar)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function Eventos() {


  const handleUpdateEvent = async () => {
    if (!editEventData.id) {
      alert("No se encontró el ID del evento a editar.");
      return;
    }
  
    try {
      // Referencia al documento en la colección "eventos"
      const eventRef = doc(db, 'eventos', editEventData.id);
  
      // Actualizar el documento en Firestore
      await updateDoc(eventRef, {
        nombre: editEventData.nombre,
        descripcion: editEventData.descripcion,
        participantes: editEventData.participantes
      });
  
      alert("¡Evento actualizado correctamente!");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al actualizar el evento:", error);
      alert("Ocurrió un error al actualizar el evento: " + error.message);
    }
  };
  // Estado para el listado de eventos
  const [eventos, setEventos] = useState([]);

  // Estado para el modal de creación
  const [modalOpen, setModalOpen] = useState(false);

  // Estado para los datos de un nuevo evento
  const [eventoData, setEventoData] = useState({
    nombre: '',
    descripcion: '',
    archivo: null,
    datos: [], // Participantes
  });
  
  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...editEventData.participantes];
    updatedParticipants[index][field] = value;
    setEditEventData({ ...editEventData, participantes: updatedParticipants });
  };
  

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEventData, setEditEventData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    participantes: []
    // Podrías poner aquí archivo: null si deseas re-subir Excel
  });

  const handleOpenEditModal = (evento) => {
    setEditModalOpen(true);
    setEditEventData({
      id: evento.id,                  // Importante para saber cuál doc actualizar
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      participantes: evento.participantes || []
      // Si quieres permitir volver a subir el Excel, puedes manejarlo aquí
    });
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditEventData({
      id: '',
      nombre: '',
      descripcion: '',
      participantes: []
    });
  };
  
  


  // Estado para filtrar eventos
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para mostrar info detallada al hacer clic en un evento
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Configuración de dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: (files) => handleFileUpload(files[0]),
  });

  // ----------------------------------------------------------------------
  // Cargar eventos en tiempo real desde Firebase
  // ----------------------------------------------------------------------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'eventos'), (snapshot) => {
      const eventosArr = [];
      snapshot.forEach((doc) => {
        eventosArr.push({ id: doc.id, ...doc.data() });
      });
      setEventos(eventosArr);
    });
    return () => unsub();
  }, []);

  // ----------------------------------------------------------------------
  // Manejo de carga de archivo Excel
  // ----------------------------------------------------------------------
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Validar cabeceras
      const headers = jsonData[0]?.map((h) => String(h).toLowerCase()) || [];
      const requiredHeaders = [
        'nombre del equipo',
        'alumnos',
        'num. control',
        'carrera',
        'semestre',
        'correo'
      ];

      const hasAllHeaders = requiredHeaders.every((h) =>
        headers.includes(h.toLowerCase())
      );

      if (!hasAllHeaders) {
        alert('El archivo no tiene las columnas requeridas.');
        return;
      }

      // Procesar filas, saltando la primera (cabeceras)
      const datos = jsonData.slice(1).map((row) => ({
        equipo: row[0] || '',
        alumnos: row[1] || '',
        numControl: row[2] || '',
        carrera: row[3] || '',
        semestre: row[4] || '',
        correo: row[5] || ''
      }));

      setEventoData((prev) => ({
        ...prev,
        archivo: file,
        datos
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  // ----------------------------------------------------------------------
  // Guardar Evento en Firebase
  // ----------------------------------------------------------------------
  const handleGuardar = async () => {
    if (!eventoData.nombre || !eventoData.descripcion || eventoData.datos.length === 0) {
      alert('Completa todos los campos requeridos (nombre, descripción y Excel).');
      return;
    }

    const nuevoEvento = {
      nombre: eventoData.nombre,
      descripcion: eventoData.descripcion,
      fecha: new Date().toLocaleDateString('es-MX'),
      participantes: eventoData.datos, // array con los participantes del excel
    };

    try {
      await addDoc(collection(db, 'eventos'), nuevoEvento);
      // Limpiar formulario
      setModalOpen(false);
      setEventoData({
        nombre: '',
        descripcion: '',
        archivo: null,
        datos: []
      });
    } catch (error) {
      console.error('Error al guardar el evento en Firebase:', error);
      alert('Error al guardar el evento: ' + error.message);
    }
  };

  // ----------------------------------------------------------------------
  // Manejar la selección de un evento (abrir modal con info)
  // ----------------------------------------------------------------------
  const handleCardClick = (evento) => {
    setSelectedEvent(evento);
  };

  // Cerrar modal de detalle
  const handleCloseDetailModal = () => {
    setSelectedEvent(null);
  };

  // ----------------------------------------------------------------------
  // Filtrado simple de eventos por "nombre"
  // ----------------------------------------------------------------------
  const filteredEvents = eventos.filter((ev) =>
    ev.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <SearchInput
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ActionButton onClick={() => setModalOpen(true)}>
          + Nuevo Evento
        </ActionButton>
      </Header>

      <EventosGrid>
        {filteredEvents.map((evento) => (
          <Card
            key={evento.id}
            id={evento.id}
            title={evento.nombre}
            date={evento.fecha}
            description={evento.descripcion}
            onClick={() => handleCardClick(evento)}
          />
        ))}
      </EventosGrid>

      {/* MODAL CREAR NUEVO EVENTO */}
      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Crear Nuevo Evento</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <label>Nombre del Evento</label>
              <Input
                value={eventoData.nombre}
                onChange={(e) => setEventoData({ ...eventoData, nombre: e.target.value })}
                placeholder="Ej: Hackathon 2024"
              />
            </FormGroup>

            <FormGroup>
              <label>Descripción</label>
              <Textarea
                rows="3"
                value={eventoData.descripcion}
                onChange={(e) => setEventoData({ ...eventoData, descripcion: e.target.value })}
                placeholder="Ej: Competencia de programación para alumnos de distintas carreras"
              />
            </FormGroup>

            <FormGroup>
              <label>Importar participantes desde Excel</label>
              <Dropzone {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                {eventoData.archivo && <p>{eventoData.archivo.name}</p>}
              </Dropzone>
            </FormGroup>

            {eventoData.datos.length > 0 && (
              <TablaContainer>
                <Tabla>
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Alumnos</th>
                      <th>No. Control</th>
                      <th>Carrera</th>
                      <th>Semestre</th>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventoData.datos.map((dato, index) => (
                      <tr key={index}>
                        <td>{dato.equipo}</td>
                        <td>{dato.alumnos}</td>
                        <td>{dato.numControl}</td>
                        <td>{dato.carrera}</td>
                        <td>{dato.semestre}</td>
                        <td>{dato.correo}</td>
                      </tr>
                    ))}
                  </tbody>
                </Tabla>
              </TablaContainer>
            )}

            <ModalActions>
              <SecondaryButton onClick={() => setModalOpen(false)}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleGuardar}>
                Guardar Evento
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}


      {editModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Editar Evento</h2>
              <CloseButton onClick={handleCloseEditModal}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <label>Nombre del Evento</label>
              <Input
                value={editEventData.nombre}
                onChange={(e) =>
                  setEditEventData({ ...editEventData, nombre: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <label>Descripción</label>
              <Textarea
                rows="3"
                value={editEventData.descripcion}
                onChange={(e) =>
                  setEditEventData({ ...editEventData, descripcion: e.target.value })
                }
              />
            </FormGroup>

            {/* Sección para editar participantes */}
            {editEventData.participantes && editEventData.participantes.length > 0 && (
              <>
                <h3>Editar Participantes</h3>
                <TablaContainer>
                  <Tabla>
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Alumnos</th>
                        <th>No. Control</th>
                        <th>Carrera</th>
                        <th>Semestre</th>
                        <th>Correo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editEventData.participantes.map((p, i) => (
                        <tr key={i}>
                          <td>
                            <MiniInput
                              value={p.equipo}
                              onChange={(e) => handleParticipantChange(i, 'equipo', e.target.value)}
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.alumnos}
                              onChange={(e) => handleParticipantChange(i, 'alumnos', e.target.value)}
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.numControl}
                              onChange={(e) => handleParticipantChange(i, 'numControl', e.target.value)}
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.carrera}
                              onChange={(e) => handleParticipantChange(i, 'carrera', e.target.value)}
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.semestre}
                              onChange={(e) => handleParticipantChange(i, 'semestre', e.target.value)}
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.correo}
                              onChange={(e) => handleParticipantChange(i, 'correo', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Tabla>
                </TablaContainer>
              </>
            )}

            <ModalActions>
              <SecondaryButton onClick={handleCloseEditModal}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleUpdateEvent}>Guardar Cambios</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* MODAL DETALLE DE UN EVENTO AL HACER CLIC EN LA CARD */}
      {selectedEvent && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Detalles del Evento</h2>
              <CloseButton onClick={handleCloseDetailModal}>×</CloseButton>
            </ModalHeader>

            <DetailsContainer>
              <p><strong>Nombre:</strong> {selectedEvent.nombre}</p>
              <p><strong>Descripción:</strong> {selectedEvent.descripcion}</p>
              <p><strong>Fecha de Creación:</strong> {selectedEvent.fecha}</p>
            </DetailsContainer>

            {selectedEvent.participantes && selectedEvent.participantes.length > 0 && (
              <>
                <h3>Participantes</h3>
                <TablaContainer>
                  <Tabla>
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Alumnos</th>
                        <th>No. Control</th>
                        <th>Carrera</th>
                        <th>Semestre</th>
                        <th>Correo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEvent.participantes.map((p, i) => (
                        <tr key={i}>
                          <td>{p.equipo}</td>
                          <td>{p.alumnos}</td>
                          <td>{p.numControl}</td>
                          <td>{p.carrera}</td>
                          <td>{p.semestre}</td>
                          <td>{p.correo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Tabla>
                </TablaContainer>
              </>
            )}
          </Modal>
        </ModalBackdrop>
      )}
      {selectedEvent && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Detalles del Evento</h2>
              <CloseButton onClick={handleCloseDetailModal}>×</CloseButton>
            </ModalHeader>

            <DetailsContainer>
              <p><strong>Nombre:</strong> {selectedEvent.nombre}</p>
              <p><strong>Descripción:</strong> {selectedEvent.descripcion}</p>
              <p><strong>Fecha de Creación:</strong> {selectedEvent.fecha}</p>
            </DetailsContainer>

            {selectedEvent.participantes && selectedEvent.participantes.length > 0 && (
              <>
                <h3>Participantes</h3>
                <TablaContainer>
                  <Tabla>
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Alumnos</th>
                        <th>No. Control</th>
                        <th>Carrera</th>
                        <th>Semestre</th>
                        <th>Correo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEvent.participantes.map((p, i) => (
                        <tr key={i}>
                          <td>{p.equipo}</td>
                          <td>{p.alumnos}</td>
                          <td>{p.numControl}</td>
                          <td>{p.carrera}</td>
                          <td>{p.semestre}</td>
                          <td>{p.correo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Tabla>
                </TablaContainer>
              </>
            )}

            <ModalActions>
              <SecondaryButton onClick={handleCloseDetailModal}>Cerrar</SecondaryButton>
              <PrimaryButton onClick={() => handleOpenEditModal(selectedEvent)}>
                Editar
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

// ----------------------------------------------------------------------
// Estilos
// ----------------------------------------------------------------------
const Container = styled.div`
  padding: 20px 30px;
  height: 100vh;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.textprimary};
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 400px;
  padding: 10px 15px;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  background: ${({ theme }) => theme.bg || '#fff'};
  color: ${({ theme }) => theme.text || '#000'};
`;

const ActionButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.primary || '#347ba7'};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.3s;
  &:hover {
    opacity: 0.9;
  }
`;

const EventosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.bg || '#fff'};
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  padding: 25px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.textsecondary || '#999'};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-weight: 500;
  }
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg2 || '#f9f9f9'};
  color: ${({ theme }) => theme.text || '#000'};
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg2 || '#f9f9f9'};
  color: ${({ theme }) => theme.text || '#000'};
`;

const Dropzone = styled.div`
  border: 2px dashed ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  &:hover {
    border-color: ${({ theme }) => theme.primary || '#347ba7'};
  }
`;

const TablaContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.border || '#ccc'};
  }
  th {
    background: ${({ theme }) => theme.bgsecondary || '#f0f0f0'};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
`;

const PrimaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.primary || '#347ba7'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.bgsecondary || '#eee'};
  color: ${({ theme }) => theme.text || '#000'};
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 6px;
  cursor: pointer;
`;

const DetailsContainer = styled.div`
  p {
    margin: 0.5rem 0;
  }
`;

// MiniInput para edición de participantes en la tabla
const MiniInput = styled.input`
  width: 100%;
  padding: 5px;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 4px;
  background: ${({ theme }) => theme.bg2 || '#f9f9f9'};
  color: ${({ theme }) => theme.text || '#000'};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.primary || '#347ba7'};
  }
`;

