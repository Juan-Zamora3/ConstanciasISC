// src/pages/IntegrantesSection.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function IntegrantesSection({ eventoId }) {
  const [integrantes, setIntegrantes] = useState([]);
  const [equipos, setEquipos] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Campos para agregar
  const [newIntegrante, setNewIntegrante] = useState({
    nombre: '',
    apellidos: '',
    equipoId: ''
  });

  // Para editar
  const [selectedIntegrante, setSelectedIntegrante] = useState(null);
  const [editData, setEditData] = useState({
    nombre: '',
    apellidos: '',
    equipoId: ''
  });

  // Cargar equipos de este evento
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

  // Cargar integrantes de este evento
  useEffect(() => {
    const q = query(collection(db, 'integrantes'), where('eventoId', '==', eventoId));
    const unsub = onSnapshot(q, (snapshot) => {
      const arr = [];
      snapshot.forEach((docSnap) => {
        arr.push({ id: docSnap.id, ...docSnap.data() });
      });
      setIntegrantes(arr);
    });
    return () => unsub();
  }, [eventoId]);

  // Abrir modal para agregar un integrante
  const handleOpenAddModal = () => {
    setNewIntegrante({ nombre: '', apellidos: '', equipoId: '' });
    setAddModalOpen(true);
  };

  // Guardar nuevo integrante
  const handleAddIntegrante = async () => {
    if (!newIntegrante.nombre || !newIntegrante.equipoId) {
      alert('Completa el nombre y selecciona equipo');
      return;
    }
    try {
      await addDoc(collection(db, 'integrantes'), {
        eventoId,
        nombre: newIntegrante.nombre,
        apellidos: newIntegrante.apellidos,
        equipoId: newIntegrante.equipoId
      });
      setAddModalOpen(false);
    } catch (error) {
      console.error('Error al agregar integrante:', error);
      alert('Ocurrió un error al agregar integrante');
    }
  };

  // Abrir modal para editar un integrante
  const handleOpenEditModal = (integ) => {
    setSelectedIntegrante(integ);
    setEditData({
      nombre: integ.nombre,
      apellidos: integ.apellidos,
      equipoId: integ.equipoId
    });
    setEditModalOpen(true);
  };

  // Guardar cambios al editar
  const handleEditIntegrante = async () => {
    if (!selectedIntegrante) return;
    if (!editData.nombre || !editData.equipoId) {
      alert('Completa el nombre y equipo');
      return;
    }
    try {
      const ref = doc(db, 'integrantes', selectedIntegrante.id);
      await updateDoc(ref, {
        nombre: editData.nombre,
        apellidos: editData.apellidos,
        equipoId: editData.equipoId
      });
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error al editar integrante:', error);
      alert('No se pudo editar');
    }
  };

  // Eliminar integrante
  const handleDeleteIntegrante = async (integ) => {
    if (!window.confirm(`¿Eliminar a ${integ.nombre} ${integ.apellidos}?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'integrantes', integ.id));
    } catch (error) {
      console.error('Error al eliminar integrante:', error);
      alert('No se pudo eliminar');
    }
  };

  return (
    <>
      <HeaderBar>
        <Button onClick={handleOpenAddModal}>+ Agregar Integrante</Button>
      </HeaderBar>

      <TableContainer>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>No. Control</th>
              <th>Carrera</th>
              <th>Semestre</th>
              <th>Correo</th>
              <th>Equipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {integrantes.map((ing) => (
              <tr key={ing.id}>
                <td>{ing.nombre}</td>
                <td>{ing.numControl}</td>
                <td>{ing.carrera}</td>
                <td>{ing.semestre}</td>
                <td>{ing.correo}</td>
                <td>{ing.equipoId}</td> 
                {/* O puedes buscar el nombre de equipo consultando la coleccion 'equipos' */}
                <td>
                  {/* Botones de editar/eliminar */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>

      {/* Modal para agregar integrante */}
      {addModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h3>Agregar Integrante</h3>
              <CloseButton onClick={() => setAddModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input 
                value={newIntegrante.nombre}
                onChange={(e) => 
                  setNewIntegrante({ ...newIntegrante, nombre: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <label>Apellidos</label>
              <input 
                value={newIntegrante.apellidos}
                onChange={(e) => 
                  setNewIntegrante({ ...newIntegrante, apellidos: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <label>Equipo</label>
              <select
                value={newIntegrante.equipoId}
                onChange={(e) => 
                  setNewIntegrante({ ...newIntegrante, equipoId: e.target.value })
                }
              >
                <option value="">-- Seleccionar Equipo --</option>
                {equipos.map((eq) => (
                  <option value={eq.id} key={eq.id}>{eq.nombre}</option>
                ))}
              </select>
            </FormGroup>
            <ModalActions>
              <SecondaryButton onClick={() => setAddModalOpen(false)}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleAddIntegrante}>
                Guardar
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Modal para editar integrante */}
      {editModalOpen && selectedIntegrante && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h3>Editar Integrante</h3>
              <CloseButton onClick={() => setEditModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input 
                value={editData.nombre}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Apellidos</label>
              <input 
                value={editData.apellidos}
                onChange={(e) => setEditData({ ...editData, apellidos: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Equipo</label>
              <select
                value={editData.equipoId}
                onChange={(e) => setEditData({ ...editData, equipoId: e.target.value })}
              >
                <option value="">-- Seleccionar Equipo --</option>
                {equipos.map((eq) => (
                  <option value={eq.id} key={eq.id}>{eq.nombre}</option>
                ))}
              </select>
            </FormGroup>
            <ModalActions>
              <SecondaryButton onClick={() => setEditModalOpen(false)}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleEditIntegrante}>
                Guardar
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </>
  );
}

// ----------------- Estilos -----------------
const HeaderBar = styled.div`
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: ${({ theme }) => theme.primary || '#347ba7'};
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  table {
    width: 100%;
    border-collapse: collapse;
    th, td {
      padding: 10px;
      border-bottom: 1px solid #ccc;
    }
    th {
      background: ${({ theme }) => theme.bg4 || '#ccc'};
      color: ${({ theme }) => theme.textsecondary || '#fff'};
    }
  }
`;

const SmallButton = styled.button`
  margin-right: 5px;
  background: ${({ theme }) => theme.primary};
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
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
  z-index: 999;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.bg2 || '#f9f9f9'};
  width: 90%;
  max-width: 500px;
  padding: 20px;
  border-radius: 8px;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  h3 {
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
    border: 1px solid #ccc;
    border-radius: 6px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  background: ${({ theme }) => theme.bg || '#eee'};
  color: ${({ theme }) => theme.text || '#000'};
  border: 1px solid #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
`;
