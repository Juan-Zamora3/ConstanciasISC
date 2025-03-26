// IntegrantesSection.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function IntegrantesSection({ eventoId }) {
  const [integrantes, setIntegrantes] = useState([]);
  const [equipos, setEquipos] = useState([]);

  // Para modal de agregar integrante
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newInteg, setNewInteg] = useState({
    nombre: '',
    numControl: '',
    carrera: '',
    semestre: '',
    correo: '',
    equipoId: ''
  });

  // Para modal de editar integrante
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedIntegrante, setSelectedIntegrante] = useState(null);
  const [editData, setEditData] = useState({
    nombre: '',
    numControl: '',
    carrera: '',
    semestre: '',
    correo: '',
    equipoId: ''
  });

  // Cargar equipos para el combo (así el usuario elige a cuál equipo pertenece)
  useEffect(() => {
    const qEquipos = query(collection(db, 'equipos'), where('eventoId', '==', eventoId));
    const unsubEq = onSnapshot(qEquipos, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEquipos(arr);
    });
    return () => unsubEq();
  }, [eventoId]);

  // Cargar integrantes
  useEffect(() => {
    const qInteg = query(collection(db, 'integrantes'), where('eventoId', '==', eventoId));
    const unsubInt = onSnapshot(qInteg, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIntegrantes(arr);
    });
    return () => unsubInt();
  }, [eventoId]);

  // ------------------- Agregar Integrante
  const handleOpenAddModal = () => {
    setNewInteg({
      nombre: '',
      numControl: '',
      carrera: '',
      semestre: '',
      correo: '',
      equipoId: ''
    });
    setAddModalOpen(true);
  };
  const handleCloseAddModal = () => setAddModalOpen(false);

  const handleAddIntegrante = async () => {
    if (!newInteg.nombre.trim() || !newInteg.equipoId) {
      alert('Completa el nombre y el equipo');
      return;
    }
    try {
      await addDoc(collection(db, 'integrantes'), {
        eventoId,
        equipoId: newInteg.equipoId,
        nombre: newInteg.nombre,
        numControl: newInteg.numControl,
        carrera: newInteg.carrera,
        semestre: newInteg.semestre,
        correo: newInteg.correo
      });
      alert('Integrante agregado');
      setAddModalOpen(false);
    } catch (error) {
      console.error('Error al agregar integrante:', error);
      alert('No se pudo agregar');
    }
  };

  // ------------------- Editar Integrante
  const handleOpenEditModal = (item) => {
    setSelectedIntegrante(item);
    setEditData({
      nombre: item.nombre,
      numControl: item.numControl,
      carrera: item.carrera,
      semestre: item.semestre,
      correo: item.correo,
      equipoId: item.equipoId
    });
    setEditModalOpen(true);
  };
  const handleCloseEditModal = () => setEditModalOpen(false);

  const handleEditIntegrante = async () => {
    if (!selectedIntegrante) return;
    if (!editData.nombre.trim() || !editData.equipoId) {
      alert('Completa el nombre y equipo');
      return;
    }
    try {
      const ref = doc(db, 'integrantes', selectedIntegrante.id);
      await updateDoc(ref, {
        nombre: editData.nombre,
        numControl: editData.numControl,
        carrera: editData.carrera,
        semestre: editData.semestre,
        correo: editData.correo,
        equipoId: editData.equipoId
      });
      alert('Integrante actualizado');
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error al editar integrante:', error);
      alert('No se pudo editar');
    }
  };

  // ------------------- Eliminar Integrante
  const handleDeleteIntegrante = async (item) => {
    if (!window.confirm(`¿Eliminar a "${item.nombre}"?`)) return;
    try {
      await deleteDoc(doc(db, 'integrantes', item.id));
    } catch (error) {
      console.error('Error al eliminar integrante:', error);
      alert('No se pudo eliminar');
    }
  };

  return (
    <Container>
      <HeaderBar>
        <AddButton onClick={handleOpenAddModal}>+ Agregar Integrante</AddButton>
      </HeaderBar>

      <TableContainer>
        <ThemeTable>
          <thead>
            <tr>
              <ThemeTableHeader>Nombre</ThemeTableHeader>
              <ThemeTableHeader>No. Control</ThemeTableHeader>
              <ThemeTableHeader>Carrera</ThemeTableHeader>
              <ThemeTableHeader>Semestre</ThemeTableHeader>
              <ThemeTableHeader>Correo</ThemeTableHeader>
              <ThemeTableHeader>Equipo</ThemeTableHeader>
              <ThemeTableHeader>Acciones</ThemeTableHeader>
            </tr>
          </thead>
          <tbody>
            {integrantes.map((item) => {
              // Buscar el nombre del equipo
              const eq = equipos.find((e) => e.id === item.equipoId);
              return (
                <ThemeTableRow key={item.id}>
                  <ThemeTableCell>{item.nombre}</ThemeTableCell>
                  <ThemeTableCell>{item.numControl}</ThemeTableCell>
                  <ThemeTableCell>{item.carrera}</ThemeTableCell>
                  <ThemeTableCell>{item.semestre}</ThemeTableCell>
                  <ThemeTableCell>{item.correo}</ThemeTableCell>
                  <ThemeTableCell>{eq ? eq.nombre : 'Sin equipo'}</ThemeTableCell>
                  <ThemeTableCell>
                    <ActionButton onClick={() => handleOpenEditModal(item)}>Editar</ActionButton>
                    <ActionButton variant="danger" onClick={() => handleDeleteIntegrante(item)}>
                      Eliminar
                    </ActionButton>
                  </ThemeTableCell>
                </ThemeTableRow>
              );
            })}
          </tbody>
        </ThemeTable>
      </TableContainer>

      {/* Modal Agregar Integrante */}
      {addModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Agregar Integrante</h2>
              <CloseButton onClick={handleCloseAddModal}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input 
                value={newInteg.nombre}
                onChange={(e) => setNewInteg({ ...newInteg, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>No. Control</label>
              <input
                value={newInteg.numControl}
                onChange={(e) => setNewInteg({ ...newInteg, numControl: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Carrera</label>
              <input
                value={newInteg.carrera}
                onChange={(e) => setNewInteg({ ...newInteg, carrera: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Semestre</label>
              <input
                value={newInteg.semestre}
                onChange={(e) => setNewInteg({ ...newInteg, semestre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <input
                value={newInteg.correo}
                onChange={(e) => setNewInteg({ ...newInteg, correo: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Equipo</label>
              <select
                value={newInteg.equipoId}
                onChange={(e) => setNewInteg({ ...newInteg, equipoId: e.target.value })}
              >
                <option value="">-- Selecciona un equipo --</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </FormGroup>

            <ModalActions>
              <SecondaryButton onClick={handleCloseAddModal}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleAddIntegrante}>Guardar</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Modal Editar Integrante */}
      {editModalOpen && selectedIntegrante && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Editar Integrante</h2>
              <CloseButton onClick={handleCloseEditModal}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input 
                value={editData.nombre}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>No. Control</label>
              <input
                value={editData.numControl}
                onChange={(e) => setEditData({ ...editData, numControl: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Carrera</label>
              <input
                value={editData.carrera}
                onChange={(e) => setEditData({ ...editData, carrera: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Semestre</label>
              <input
                value={editData.semestre}
                onChange={(e) => setEditData({ ...editData, semestre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <input
                value={editData.correo}
                onChange={(e) => setEditData({ ...editData, correo: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Equipo</label>
              <select
                value={editData.equipoId}
                onChange={(e) => setEditData({ ...editData, equipoId: e.target.value })}
              >
                <option value="">-- Selecciona un equipo --</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </FormGroup>

            <ModalActions>
              <SecondaryButton onClick={handleCloseEditModal}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleEditIntegrante}>Guardar</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

// -------------------- Estilos (viejo formato) --------------------
const Container = styled.div`
  padding: 1rem;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const AddButton = styled.button`
  padding: 8px 16px;
  background: ${({ theme }) => theme.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

// Reutilizamos lo de la tabla
export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: 1rem;
`;

export const ThemeTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export const ThemeTableHeader = styled.th`
  padding: 12px;
  text-align: left;
  background-color: ${({ theme }) => theme.bg4};
  color: ${({ theme }) => theme.textsecondary};
  border-bottom: 2px solid ${({ theme }) => theme.border};
`;

export const ThemeTableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${({ theme }) => theme.bg2};
  }
  &:hover {
    background-color: ${({ theme }) => theme.bgHover || '#ddd'};
  }
`;

export const ThemeTableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

export const ActionButton = styled.button`
  padding: 6px 12px;
  margin-right: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${({ theme, variant }) => 
    variant === 'danger' 
      ? '#e74c3c' 
      : theme.primary
  };
  color: #fff;
  &:hover {
    opacity: 0.9;
  }
`;

// ------------ Modales y formularios -----------
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
  background: ${({ theme }) => theme.bg};
  width: 90%;
  max-width: 600px;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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
  margin-bottom: 1rem;
  label {
    font-weight: 500;
    margin-bottom: 0.3rem;
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
  gap: 1rem;
  margin-top: 1rem;
`;

const PrimaryButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  background: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
`;
