// src/pages/EquiposSection.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function EquiposSection({ eventoId }) {
  const [equipos, setEquipos] = useState([]);
  
  // Modal principal para crear un nuevo equipo
  const [modalOpen, setModalOpen] = useState(false);
  
  // Modal para ver/editar equipo
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Datos del nuevo equipo + arreglo local de integrantes
  const [equipoData, setEquipoData] = useState({ nombre: '' });
  const [manualIntegrantes, setManualIntegrantes] = useState([]);
  const [newIntegrante, setNewIntegrante] = useState({
    alumnos: '',
    numControl: '',
    carrera: '',
    semestre: '',
    correo: '',
  });

  // Equipo seleccionado para mostrar/editar
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamIntegrantes, setTeamIntegrantes] = useState([]);

  // ------------------------------------------------------------------
  // Al montar, escuchar en tiempo real los equipos de este evento
  // ------------------------------------------------------------------
  useEffect(() => {
    const q = query(collection(db, 'equipos'), where('eventoId', '==', eventoId));
    const unsub = onSnapshot(q, (snapshot) => {
      const arr = [];
      snapshot.forEach((docSnap) => {
        arr.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEquipos(arr);
    });
    return () => unsub();
  }, [eventoId]);

  // ------------------------------------------------------------------
  // Cuando se selecciona un equipo, cargamos sus integrantes
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!selectedTeam) return;
    const q = query(collection(db, 'integrantes'), where('equipoId', '==', selectedTeam.id));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamIntegrantes(arr);
    });
    return () => unsub();
  }, [selectedTeam]);

  // ------------------------------------------------------------------
  // ABRIR/CERRAR modal para crear equipo
  // ------------------------------------------------------------------
  const handleOpenAddModal = () => {
    // Reiniciar campos antes de abrir
    setEquipoData({ nombre: '' });
    setManualIntegrantes([]);
    setNewIntegrante({
      alumnos: '',
      numControl: '',
      carrera: '',
      semestre: '',
      correo: '',
    });
    setModalOpen(true);
  };

  // ------------------------------------------------------------------
  // Agregar un integrante manual al arreglo local (no en Firestore)
  // ------------------------------------------------------------------
  const handleAddManualIntegrante = () => {
    if (!newIntegrante.alumnos.trim()) {
      alert('Completa el nombre del integrante');
      return;
    }
    setManualIntegrantes([...manualIntegrantes, newIntegrante]);
    // Limpiamos campos del integrante
    setNewIntegrante({
      alumnos: '',
      numControl: '',
      carrera: '',
      semestre: '',
      correo: '',
    });
  };

  const handleDeleteManualIntegrante = (index) => {
    const updated = [...manualIntegrantes];
    updated.splice(index, 1);
    setManualIntegrantes(updated);
  };

  // ------------------------------------------------------------------
  // CREAR el nuevo equipo en Firestore junto con sus integrantes
  // ------------------------------------------------------------------
  const handleGuardarEquipo = async () => {
    if (!equipoData.nombre.trim()) {
      alert('Ingresa el nombre del equipo');
      return;
    }

    try {
      // 1) Crear el documento del equipo
      const equipoRef = await addDoc(collection(db, 'equipos'), {
        eventoId,
        nombre: equipoData.nombre,
      });

      // 2) Para cada integrante en memoria, crearlo en la colección 'integrantes'
      for (const integrante of manualIntegrantes) {
        await addDoc(collection(db, 'integrantes'), {
          equipoId: equipoRef.id,
          eventoId,
          nombre: integrante.alumnos,
          numControl: integrante.numControl,
          carrera: integrante.carrera,
          semestre: integrante.semestre,
          correo: integrante.correo,
          // Agregar si quieres almacenar también el "equipo" por nombre:
          // equipo: equipoData.nombre,
        });
      }

      alert('¡Equipo creado con éxito!');
      
      // 3) Limpiar campos y cerrar modal
      setManualIntegrantes([]);
      setEquipoData({ nombre: '' });
      setModalOpen(false);

    } catch (error) {
      console.error('Error al guardar el equipo:', error);
      alert('Error al guardar el equipo: ' + error.message);
    }
  };

  // ------------------------------------------------------------------
  // ELIMINAR un equipo (con su “X” en la tarjeta)
  // ------------------------------------------------------------------
  const handleDeleteTeam = async (teamId) => {
    const confirm = window.confirm('¿Seguro que deseas eliminar este equipo?');
    if (!confirm) return;

    try {
      // Eliminar primero los integrantes de ese equipo
      const integQ = query(collection(db, 'integrantes'), where('equipoId', '==', teamId));
      const snap = await getDocs(integQ);
      for (const docIn of snap.docs) {
        await deleteDoc(doc(db, 'integrantes', docIn.id));
      }

      // Ahora sí, eliminar el equipo
      await deleteDoc(doc(db, 'equipos', teamId));
      alert('Equipo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      alert('No se pudo eliminar el equipo.');
    }
  };

  // ------------------------------------------------------------------
  // ABRIR modal de detalle/edición de equipo (para editar NOMBRE o integrantes)
  // ------------------------------------------------------------------
  const handleOpenTeamModal = (team) => {
    setSelectedTeam(team);
    setTeamName(team.nombre);
    setEditModalOpen(true);
  };

  // GUARDAR cambios de nombre del equipo
  const handleUpdateTeam = async () => {
    if (!teamName.trim() || !selectedTeam) return;

    try {
      const ref = doc(db, 'equipos', selectedTeam.id);
      await updateDoc(ref, { nombre: teamName });
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      alert('No se pudo actualizar el equipo');
    }
  };

  // ------------------------------------------------------------------
  // Edición de integrante dentro de un equipo
  // ------------------------------------------------------------------
  const [editIntegranteOpen, setEditIntegranteOpen] = useState(false);
  const [editIntegranteData, setEditIntegranteData] = useState({
    id: '',
    nombre: '',
    numControl: '',
    carrera: '',
    semestre: '',
    correo: '',
  });

  const handleOpenEditIntegrante = (integrante) => {
    setEditIntegranteData(integrante);
    setEditIntegranteOpen(true);
  };

  const handleSaveEditIntegrante = async () => {
    try {
      const ref = doc(db, 'integrantes', editIntegranteData.id);
      await updateDoc(ref, {
        nombre: editIntegranteData.nombre,
        numControl: editIntegranteData.numControl,
        carrera: editIntegranteData.carrera,
        semestre: editIntegranteData.semestre,
        correo: editIntegranteData.correo,
      });
      alert('¡Integrante actualizado!');
      setEditIntegranteOpen(false);
    } catch (error) {
      console.error('Error al actualizar integrante:', error);
      alert('No se pudo actualizar el integrante.');
    }
  };

  const handleDeleteIntegrante = async (integrante) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a ${integrante.nombre}?`)) return;
    try {
      await deleteDoc(doc(db, 'integrantes', integrante.id));
      alert('¡Integrante eliminado!');
    } catch (error) {
      console.error('Error al eliminar integrante:', error);
      alert('No se pudo eliminar el integrante.');
    }
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <>
      <AddButton onClick={handleOpenAddModal}>+ Agregar Equipo</AddButton>

      <TeamsGrid>
        {equipos.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onOpen={() => handleOpenTeamModal(team)}
            onDelete={() => handleDeleteTeam(team.id)}
          />
        ))}
      </TeamsGrid>

      {/* Modal para CREAR equipo + integrantes */}
      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Agregar Equipo</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            {/* Nombre del Equipo */}
            <FormGroup>
              <label>Nombre del Equipo</label>
              <input
                value={equipoData.nombre}
                onChange={(e) => setEquipoData({ ...equipoData, nombre: e.target.value })}
              />
            </FormGroup>

            {/* Form para agregar integrantes al arreglo local */}
            <FormGroupRow>
              <Column>
                <label>Nombre</label>
                <Input
                  value={newIntegrante.alumnos}
                  onChange={(e) => setNewIntegrante({ ...newIntegrante, alumnos: e.target.value })}
                />
                <label>No. Control</label>
                <Input
                  value={newIntegrante.numControl}
                  onChange={(e) => setNewIntegrante({ ...newIntegrante, numControl: e.target.value })}
                />
                <label>Carrera</label>
                <Input
                  value={newIntegrante.carrera}
                  onChange={(e) => setNewIntegrante({ ...newIntegrante, carrera: e.target.value })}
                />
              </Column>

              <Column>
                <label>Semestre</label>
                <Input
                  value={newIntegrante.semestre}
                  onChange={(e) => setNewIntegrante({ ...newIntegrante, semestre: e.target.value })}
                />
                <label>Correo</label>
                <Input
                  value={newIntegrante.correo}
                  onChange={(e) => setNewIntegrante({ ...newIntegrante, correo: e.target.value })}
                />
              </Column>
            </FormGroupRow>
            <PrimaryButton onClick={handleAddManualIntegrante}>
              Agregar Integrante
            </PrimaryButton>

            {/* Tabla de integrantes que se están por guardar */}
            {manualIntegrantes.length > 0 && (
              <TablaContainer>
                <Tabla>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>No. Control</th>
                      <th>Carrera</th>
                      <th>Semestre</th>
                      <th>Correo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualIntegrantes.map((item, index) => (
                      <tr key={index}>
                        <td>{item.alumnos}</td>
                        <td>{item.numControl}</td>
                        <td>{item.carrera}</td>
                        <td>{item.semestre}</td>
                        <td>{item.correo}</td>
                        <td>
                          <ActionButton
                            variant="danger"
                            onClick={() => handleDeleteManualIntegrante(index)}
                          >
                            Eliminar
                          </ActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Tabla>
              </TablaContainer>
            )}

            <ModalActions>
              <SecondaryButton onClick={() => setModalOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleGuardarEquipo}>Guardar</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Modal para ver/editar equipo */}
      {editModalOpen && selectedTeam && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>{selectedTeam.nombre}</h2>
              <CloseButton onClick={() => setEditModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre del Equipo</label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </FormGroup>

            {/* Tabla de integrantes de este equipo */}
            <TablaContainer>
              <Tabla>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>No. Control</th>
                    <th>Carrera</th>
                    <th>Semestre</th>
                    <th>Correo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {teamIntegrantes.map((ing) => (
                    <tr key={ing.id}>
                      <td>{ing.nombre}</td>
                      <td>{ing.numControl}</td>
                      <td>{ing.carrera}</td>
                      <td>{ing.semestre}</td>
                      <td>{ing.correo}</td>
                      <td>
                        <ActionButton onClick={() => handleOpenEditIntegrante(ing)}>Editar</ActionButton>
                        <ActionButton variant="danger" onClick={() => handleDeleteIntegrante(ing)}>
                          Eliminar
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            </TablaContainer>

            <ModalActions>
              <SecondaryButton onClick={() => setEditModalOpen(false)}>Cerrar</SecondaryButton>
              <PrimaryButton onClick={handleUpdateTeam}>Guardar Cambios</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Modal para editar un integrante puntual */}
      {editIntegranteOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Editar Integrante</h2>
              <CloseButton onClick={() => setEditIntegranteOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input
                value={editIntegranteData.nombre}
                onChange={(e) => setEditIntegranteData({ ...editIntegranteData, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>No. Control</label>
              <input
                value={editIntegranteData.numControl}
                onChange={(e) => setEditIntegranteData({ ...editIntegranteData, numControl: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Carrera</label>
              <input
                value={editIntegranteData.carrera}
                onChange={(e) => setEditIntegranteData({ ...editIntegranteData, carrera: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Semestre</label>
              <input
                value={editIntegranteData.semestre}
                onChange={(e) => setEditIntegranteData({ ...editIntegranteData, semestre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <input
                value={editIntegranteData.correo}
                onChange={(e) => setEditIntegranteData({ ...editIntegranteData, correo: e.target.value })}
              />
            </FormGroup>
            <ModalActions>
              <SecondaryButton onClick={() => setEditIntegranteOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleSaveEditIntegrante}>Guardar Cambios</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </>
  );
}

// ------------------------------------------------------------------
// Tarjeta de equipo con la "X" para eliminar y el click para editar
// ------------------------------------------------------------------
function TeamCard({ team, onOpen, onDelete }) {
  return (
    <CardContainer>
      <DeleteTeamButton onClick={onDelete}>×</DeleteTeamButton>
      <CardContent onClick={onOpen}>
        <h3>{team.nombre}</h3>
      </CardContent>
    </CardContainer>
  );
}

// --------------------- ESTILOS ---------------------

const AddButton = styled.button`
  padding: 10px 20px;
  border: none;
  background: ${({ theme }) => theme.primary || '#347ba7'};
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1rem;
`;

const TeamsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
`;

/* Contenedor para la card */
const CardContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.bg || '#fff'};
  color: ${({ theme }) => theme.text || '#000'};
  padding: 15px;
  border-radius: 8px;
  width: 200px;
  min-height: 100px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
`;

/* Botón "X" en la esquina */
const DeleteTeamButton = styled.button`
  position: absolute;
  top: 5px;
  right: 10px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text}; /* Color del texto según el theme */
  font-size: 25px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color:rgb(170, 42, 72) /* Color de hover según el theme */
  }
`;


const CardContent = styled.div`
  height: 100%;
  cursor: pointer;
  h3 {
    margin-top: 0;
  }
  &:hover {
    opacity: 0.9;
  }
`;

// ---------- Modales y estilos de tabla (similar a Eventos.jsx) --------

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
  z-index: 999;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.bg2 || '#f0f0f0'};
  width: 95%;
  max-width: 1000px;
  padding: 20px;
  border-radius: 8px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  h2 {
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1rem;
`;

const PrimaryButton = styled.button`
  background: ${({ theme }) => theme.primary || '#347ba7'};
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  background: ${({ theme }) => theme.bg2 || '#eee'};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  label {
    font-weight: bold;
    margin-bottom: 5px;
  }
  input, select {
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.border || '#ccc'};
    border-radius: 6px;
  }
`;

const FormGroupRow = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
`;

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 6px;
`;

const TablaContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  margin-top: 20px;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    font-size: 0.9rem;
  }
  
  th {
    background-color: ${({ theme }) => theme.bg4 || '#ccc'};
    color: ${({ theme }) => theme.textsecondary || '#fff'};
  }
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  margin-right: 5px;
  background: ${({ variant }) => (variant === 'danger' ? '#e74c3c' : '#3498db')};
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;
