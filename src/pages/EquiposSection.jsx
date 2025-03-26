// src/pages/EquiposSection.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function EquiposSection({ eventoId }) {
  const [equipos, setEquipos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Nuevo equipo
  const [equipoData, setEquipoData] = useState({ nombre: '' });

  // Equipo seleccionado para mostrar/editar
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamIntegrantes, setTeamIntegrantes] = useState([]);

  // Cargar integrantes del equipo seleccionado
  useEffect(() => {
    if (!selectedTeam) return;
    const q = query(collection(db, 'integrantes'), where('equipoId', '==', selectedTeam.id));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamIntegrantes(arr);
    });
    return () => unsub();
  }, [selectedTeam]);

  // Cargar equipos en tiempo real para este evento
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

  // Abrir modal para agregar un nuevo equipo
  const handleOpenAddModal = () => {
    setEquipoData({ nombre: '' });
    setModalOpen(true);
  };

  // Guardar nuevo equipo
  const handleSaveEquipo = async () => {
    if (!equipoData.nombre) {
      alert('Ingresa el nombre del equipo');
      return;
    }
    try {
      await addDoc(collection(db, 'equipos'), {
        eventoId,
        nombre: equipoData.nombre
      });
      setModalOpen(false);
    } catch (error) {
      console.error('Error al crear equipo:', error);
      alert('Ocurrió un error al crear el equipo.');
    }
  };

  // Abrir modal de detalle/edición de equipo
  const handleOpenTeamModal = (team) => {
    setSelectedTeam(team);
    setTeamName(team.nombre);
    setEditModalOpen(true);
  };

  // Editar nombre del equipo
  const handleUpdateTeam = async () => {
    if (!teamName.trim()) {
      alert('Ingresa el nombre del equipo');
      return;
    }
    if (!selectedTeam) return;
    try {
      const ref = doc(db, 'equipos', selectedTeam.id);
      await updateDoc(ref, { nombre: teamName });
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      alert('No se pudo actualizar el equipo');
    }
  };

  // Modal de edición de integrante (completo)
  const [editIntegranteOpen, setEditIntegranteOpen] = useState(false);
  const [editIntegranteData, setEditIntegranteData] = useState({
    id: '',
    nombre: '',
    numControl: '',
    carrera: '',
    semestre: '',
    correo: ''
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

  return (
    <>
      <AddButton onClick={handleOpenAddModal}>+ Agregar Equipo</AddButton>

      <TeamsGrid>
        {equipos.map((team) => (
          <TeamCard key={team.id} team={team} onClick={() => handleOpenTeamModal(team)} />
        ))}
      </TeamsGrid>

      {/* Modal para agregar equipo */}
      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Agregar Equipo</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre del Equipo</label>
              <input 
                value={equipoData.nombre}
                onChange={(e) => setEquipoData({ nombre: e.target.value })}
              />
            </FormGroup>
            <ModalActions>
              <SecondaryButton onClick={() => setModalOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleSaveEquipo}>Guardar</PrimaryButton>
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

            {/* Contenedor con scroll para la tabla */}
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
                        <ActionButton variant="danger" onClick={() => handleDeleteIntegrante(ing)}>Eliminar</ActionButton>
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

      {/* Modal para editar integrante */}
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

// Componente de tarjeta de equipo
function TeamCard({ team, onClick }) {
  return (
    <CardContainer onClick={onClick}>
      <h3>{team.nombre}</h3>
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

const CardContainer = styled.div`
  background: ${({ theme }) => theme.bg || '#fff'};
  color: ${({ theme }) => theme.text || '#000'};
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  width: 200px;
  min-height: 100px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  &:hover {
    opacity: 0.9;
  }
`;

// ----------------- Modal y Tabla con Scroll -----------------
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
  max-width: 1200px;
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
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
  }
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

// Formato de tabla (viejo estilo) y contenedor con scroll
const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  th {
    background-color: ${({ theme }) => theme.bgSecondary};
  }
`;

const TablaContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#ddd'};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  margin-right: 5px;
  background: ${({ variant }) => (variant === 'danger' ? '#e74c3c' : '#3498db')};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${({ variant }) => (variant === 'danger' ? '#c0392b' : '#2980b9')};
  }
`;
