// Eventos.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card } from '../components/Card';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseConfig'; 
import { useNavigate } from 'react-router-dom'; // Para navegar al detalle
// import { doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

// Eventos.jsx (importaciones al inicio)
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function Eventos() {
  const navigate = useNavigate();

  // Estados principales
  const [eventos, setEventos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Nuevo evento (creación)
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoData, setEventoData] = useState({
    nombre: '',
    descripcion: '',
    archivo: null,
    datos: [], 
  });

  // Edición de evento
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEventData, setEditEventData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    participantes: []
  });




  // ----------------------------------------------------------------------
  // Eliminar un evento
  // ----------------------------------------------------------------------
  const handleDeleteEvent = async (eventoId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este evento y sus datos?')) return;

    try {
      // 1) Eliminar equipos e integrantes asociados
      //    -> Buscar "equipos" donde eventoId == eventoId
      const equiposQ = query(collection(db, 'equipos'), where('eventoId', '==', eventoId));
      const equiposSnap = await getDocs(equiposQ);
      for (const eqDoc of equiposSnap.docs) {
        const equipoId = eqDoc.id;

        // Eliminar sus integrantes
        const integrantesQ = query(collection(db, 'integrantes'), where('equipoId', '==', equipoId));
        const integSnap = await getDocs(integrantesQ);
        for (const intDoc of integSnap.docs) {
          await deleteDoc(doc(db, 'integrantes', intDoc.id));
        }

        // Luego eliminar el equipo
        await deleteDoc(doc(db, 'equipos', equipoId));
      }

      // 2) Finalmente eliminar el documento del evento
      await deleteDoc(doc(db, 'eventos', eventoId));

      alert('Evento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      alert('Error al eliminar el evento: ' + error.message);
    }
  };

  // ----------------------------------------------------------------------
  // Cargar eventos en tiempo real
  // ----------------------------------------------------------------------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'eventos'), (snapshot) => {
      const eventosArr = [];
      snapshot.forEach((docSnap) => {
        eventosArr.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEventos(eventosArr);
    });
    return () => unsub();
  }, []);

  // ----------------------------------------------------------------------
  // Manejo de carga de archivo Excel (crear evento)
  // ----------------------------------------------------------------------
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: (files) => handleFileUpload(files[0]),
  });

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

      // Procesar filas (saltando la 1ra de cabeceras)
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
  // Guardar un nuevo evento en Firebase
  //   * Crea un doc en "eventos"
  //   * Agrupa por equipo y crea docs en "equipos" / "integrantes"
  // ----------------------------------------------------------------------
// Guardar un nuevo evento en Firebase
// Guardar un nuevo evento en Firebase
// Guardar un nuevo evento en Firebase
const handleGuardar = async () => {
  if (!eventoData.nombre) {
    alert('El nombre del evento es obligatorio.');
    return;
  }

  try {
    // Si la descripción está vacía, asignar el texto "Agregando evento en blanco"
    const descripcion = eventoData.descripcion.trim() || 'Agregando evento en blanco';

    // 1. Crear el documento en la colección "eventos"
    const newEventRef = await addDoc(collection(db, 'eventos'), {
      nombre: eventoData.nombre,
      descripcion: descripcion,
      fecha: new Date().toLocaleDateString('es-MX'),
    });

    // 2. Procesar los integrantes importados desde el archivo Excel
    const teamsMap = {};
    for (const row of eventoData.datos) {
      const eqName = row.equipo.trim() || 'SIN_EQUIPO';
      if (!teamsMap[eqName]) {
        teamsMap[eqName] = [];
      }
      teamsMap[eqName].push(row);
    }

    for (const equipoName of Object.keys(teamsMap)) {
      const equipoRef = await addDoc(collection(db, 'equipos'), {
        eventoId: newEventRef.id,
        nombre: equipoName,
      });

      for (const participante of teamsMap[equipoName]) {
        await addDoc(collection(db, 'integrantes'), {
          eventoId: newEventRef.id,
          equipoId: equipoRef.id,
          nombre: participante.alumnos,
          numControl: participante.numControl,
          carrera: participante.carrera,
          semestre: participante.semestre,
          correo: participante.correo,
        });
      }
    }

    // Limpiar formulario y estado
    setModalOpen(false);
    setEventoData({ nombre: '', descripcion: '', archivo: null, datos: [] });

    alert('¡Evento creado con éxito!');
  } catch (error) {
    console.error('Error al guardar el evento en Firebase:', error);
    alert('Error al guardar el evento: ' + error.message);
  }
};



  // ----------------------------------------------------------------------
  // Navegar a la PÁGINA de detalle del evento
  // ----------------------------------------------------------------------
  const handleCardClick = (evento) => {
    navigate(`/evento/${evento.id}`);
  };

  // ----------------------------------------------------------------------
  // Lógica para editar un evento
  // ----------------------------------------------------------------------
  const handleOpenEditModal = (evento) => {
    setEditModalOpen(true);
    setEditEventData({
      id: evento.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      participantes: evento.participantes || []
    });
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditEventData({ id: '', nombre: '', descripcion: '', participantes: [] });
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...editEventData.participantes];
    updatedParticipants[index][field] = value;
    setEditEventData({ ...editEventData, participantes: updatedParticipants });
  };

  const handleUpdateEvent = async () => {
    if (!editEventData.id) {
      alert("No se encontró el ID del evento a editar.");
      return;
    }
    try {
      const eventRef = doc(db, 'eventos', editEventData.id);
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

  // ----------------------------------------------------------------------
  // Filtrado simple de eventos por "nombre"
  // ----------------------------------------------------------------------
  const filteredEvents = eventos.filter((ev) =>
    ev.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      {/* Encabezado: campo búsqueda y botón Nuevo Evento */}
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

      {/* Listado de Eventos */}
      <EventosGrid>
      {filteredEvents.map((evento) => (
          <div key={evento.id}>
            <Card
              id={evento.id}
              title={evento.nombre}
              date={evento.fecha}
              description={evento.descripcion}
              onClick={() => handleCardClick(evento)}
              onDelete={handleDeleteEvent}
            />
          </div>
        ))}
      </EventosGrid>

      {/* MODAL: CREAR NUEVO EVENTO */}
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
            {/* Agregar Integrante Manualmente */}


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
              <SecondaryButton onClick={() => setModalOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleGuardar}>Guardar Evento</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* MODAL: EDITAR EVENTO */}
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
                onChange={(e) => setEditEventData({ ...editEventData, nombre: e.target.value })}
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

            {/* Edición de participantes (obsoleto si ya no usas el array en el doc) */}
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
                              onChange={(e) =>
                                handleParticipantChange(i, 'equipo', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.alumnos}
                              onChange={(e) =>
                                handleParticipantChange(i, 'alumnos', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.numControl}
                              onChange={(e) =>
                                handleParticipantChange(i, 'numControl', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.carrera}
                              onChange={(e) =>
                                handleParticipantChange(i, 'carrera', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.semestre}
                              onChange={(e) =>
                                handleParticipantChange(i, 'semestre', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <MiniInput
                              value={p.correo}
                              onChange={(e) =>
                                handleParticipantChange(i, 'correo', e.target.value)
                              }
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
    </Container>
  );
}

// ----------------------------------------------------------------------
// Estilos (sin cambios relevantes, salvo handleGuardar)
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

const TableContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  margin-top: 20px;
  min-height: 200px;
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
    font-size: ${({ theme }) => theme.fontsm || '0.875rem'};
  }
  th {
    background-color: ${({ theme }) => theme.bg4 || '#ccc'};
    color: ${({ theme }) => theme.textsecondary || '#fff'};
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

const DeleteButton = styled.button`
  margin-top: 8px;
  padding: 6px 12px;
  background: #db3a3a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.8;
  }
`;
