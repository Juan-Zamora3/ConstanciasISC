// src/pages/EquiposSection.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function EquiposSection({ eventoId }) {
  const [equipos, setEquipos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [manualIntegrantes, setManualIntegrantes] = useState([]);
  const [equipoData, setEquipoData] = useState({ nombre: '' });
  const [newIntegrante, setNewIntegrante] = useState({
    alumnos: '', numControl: '', carrera: '', semestre: '', correo: ''
  });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamIntegrantes, setTeamIntegrantes] = useState([]);
  const [editIntegranteOpen, setEditIntegranteOpen] = useState(false);
  const [editIntegranteData, setEditIntegranteData] = useState({
    id: '', nombre: '', numControl: '', carrera: '', semestre: '', correo: ''
  });
  const [addModalOpeni, setAddModalOpeni] = useState(false);
  const [newInteg, setNewInteg] = useState({
    nombre: '', numControl: '', carrera: '', semestre: '', correo: '', equipoId: ''
  });
  const [equiposi, setEquiposi] = useState([]);

  // Escucha equipos
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'equipos'), where('eventoId', '==', eventoId)),
      snap => setEquipos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [eventoId]);

  // Escucha integrantes del equipo seleccionado
  useEffect(() => {
    if (!selectedTeam) return;
    const unsub = onSnapshot(
      query(collection(db, 'integrantes'), where('equipoId', '==', selectedTeam.id)),
      snap => setTeamIntegrantes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [selectedTeam]);

  // Escucha para modal de añadir integrante general
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'equipos'), where('eventoId', '==', eventoId)),
      snap => setEquiposi(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [eventoId]);

  // Handlers de equipo
  const handleOpenAddModal = () => {
    setEquipoData({ nombre: '' });
    setManualIntegrantes([]);
    setNewIntegrante({ alumnos: '', numControl: '', carrera: '', semestre: '', correo: '' });
    setModalOpen(true);
  };
  const handleAddManualIntegrante = () => {
    if (!newIntegrante.alumnos.trim()) return alert('Completa el nombre');
    setManualIntegrantes([...manualIntegrantes, newIntegrante]);
    setNewIntegrante({ alumnos: '', numControl: '', carrera: '', semestre: '', correo: '' });
  };
  const handleDeleteManualIntegrante = i => {
    setManualIntegrantes(manualIntegrantes.filter((_, idx) => idx !== i));
  };
  const handleGuardarEquipo = async () => {
    if (!equipoData.nombre.trim()) return alert('Ingresa nombre');
    try {
      const ref = await addDoc(collection(db, 'equipos'), {
        eventoId, nombre: equipoData.nombre
      });
      for (const m of manualIntegrantes) {
        await addDoc(collection(db, 'integrantes'), {
          ...m, eventoId, equipoId: ref.id
        });
      }
      alert('¡Equipo creado!');
      setEquipoData({ nombre: '' });
      setManualIntegrantes([]);
      setModalOpen(false);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };
  const handleDeleteTeam = async id => {
    if (!window.confirm('Eliminar equipo?')) return;
    const snap = await getDocs(query(collection(db, 'integrantes'), where('equipoId', '==', id)));
    for (const d of snap.docs) await deleteDoc(doc(db, 'integrantes', d.id));
    await deleteDoc(doc(db, 'equipos', id));
  };
  const handleOpenTeamModal = t => {
    setSelectedTeam(t);
    setTeamName(t.nombre);
    setEditModalOpen(true);
  };
  const handleUpdateTeam = async () => {
    if (!teamName.trim()) return;
    await updateDoc(doc(db, 'equipos', selectedTeam.id), { nombre: teamName });
    setEditModalOpen(false);
  };

  // Handlers de integrante dentro de equipo
  const handleOpenEditIntegrante = i => {
    setEditIntegranteData(i);
    setEditIntegranteOpen(true);
  };
  const handleSaveEditIntegrante = async () => {
    const { id, nombre, numControl, carrera, semestre, correo } = editIntegranteData;
    await updateDoc(doc(db, 'integrantes', id), { nombre, numControl, carrera, semestre, correo });
    setEditIntegranteOpen(false);
  };
  const handleDeleteIntegrante = async i => {
    if (!window.confirm(`Eliminar ${i.nombre}?`)) return;
    await deleteDoc(doc(db, 'integrantes', i.id));
  };

  // Handlers de añadir integrante general
  const handleOpenAddModali = () => {
    setNewInteg({ nombre: '', numControl: '', carrera: '', semestre: '', correo: '', equipoId: '' });
    setAddModalOpeni(true);
  };
  const handleAddIntegrantei = async () => {
    if (!newInteg.nombre.trim() || !newInteg.equipoId) return alert('Completa campos');
    await addDoc(collection(db, 'integrantes'), { ...newInteg, eventoId });
    setAddModalOpeni(false);
  };

  return (
    <>
      <ButtonRow>
        <AddButton onClick={handleOpenAddModal}>+ Agregar Equipo</AddButton>
        <AddButton onClick={handleOpenAddModali}>+ Agregar Integrante</AddButton>
      </ButtonRow>

      <TeamsGrid>
        {equipos.map(t => (
          <TeamCard key={t.id}>
            <DeleteTeamButton onClick={() => handleDeleteTeam(t.id)}>×</DeleteTeamButton>
            <CardContent onClick={() => handleOpenTeamModal(t)}>
              <h3>{t.nombre}</h3>
            </CardContent>
          </TeamCard>
        ))}
      </TeamsGrid>

      {/* Crear Equipo */}
      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Agregar Equipo</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input
                value={equipoData.nombre}
                onChange={e => setEquipoData({ nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroupRow>
              <Column>
                <label>Nombre</label>
                <Input
                  value={newIntegrante.alumnos}
                  onChange={e => setNewIntegrante({ ...newIntegrante, alumnos: e.target.value })}
                />
                <label>No. Control</label>
                <Input
                  value={newIntegrante.numControl}
                  onChange={e => setNewIntegrante({ ...newIntegrante, numControl: e.target.value })}
                />
                <label>Carrera</label>
                <Input
                  value={newIntegrante.carrera}
                  onChange={e => setNewIntegrante({ ...newIntegrante, carrera: e.target.value })}
                />
              </Column>
              <Column>
                <label>Semestre</label>
                <Input
                  value={newIntegrante.semestre}
                  onChange={e => setNewIntegrante({ ...newIntegrante, semestre: e.target.value })}
                />
                <label>Correo</label>
                <Input
                  value={newIntegrante.correo}
                  onChange={e => setNewIntegrante({ ...newIntegrante, correo: e.target.value })}
                />
              </Column>
            </FormGroupRow>
            <PrimaryButton onClick={handleAddManualIntegrante}>Agregar</PrimaryButton>
            {manualIntegrantes.length > 0 && (
              <TablaContainer>
                <Tabla>
                  <thead>
                    <tr>
                      <th>Nombre</th><th>No.Control</th><th>Carrera</th><th>Semestre</th><th>Correo</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualIntegrantes.map((m, i) => (
                      <tr key={i}>
                        <td>{m.alumnos}</td><td>{m.numControl}</td><td>{m.carrera}</td><td>{m.semestre}</td><td>{m.correo}</td>
                        <td><ActionButton variant="danger" onClick={() => handleDeleteManualIntegrante(i)}>Eliminar</ActionButton></td>
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

      {/* Editar Equipo */}
      {editModalOpen && selectedTeam && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>{selectedTeam.nombre}</h2>
              <CloseButton onClick={() => setEditModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre</label>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
              />
            </FormGroup>
            <TablaContainer>
              <Tabla>
                <thead>
                  <tr>
                    <th>Nombre</th><th>No.Control</th><th>Carrera</th><th>Semestre</th><th>Correo</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {teamIntegrantes.map(ing => (
                    <tr key={ing.id}>
                      <td>{ing.nombre}</td><td>{ing.numControl}</td><td>{ing.carrera}</td><td>{ing.semestre}</td><td>{ing.correo}</td>
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

      {/* Editar Integrante */}
      {editIntegranteOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Edit Integrante</h2>
              <CloseButton onClick={() => setEditIntegranteOpen(false)}>×</CloseButton>
            </ModalHeader>
            {['nombre','numControl','carrera','semestre','correo'].map(field => (
              <FormGroup key={field}>
                <label>{field === 'numControl' ? 'No. Control' : field.charAt(0).toUpperCase()+field.slice(1)}</label>
                <input
                  value={editIntegranteData[field]}
                  onChange={e => setEditIntegranteData({ ...editIntegranteData, [field]: e.target.value })}
                />
              </FormGroup>
            ))}
            <ModalActions>
              <SecondaryButton onClick={() => setEditIntegranteOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleSaveEditIntegrante}>Guardar Cambios</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Agregar Integrante General */}
      {addModalOpeni && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Agregar Integrante</h2>
              <CloseButton onClick={() => setAddModalOpeni(false)}>×</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Equipo</label>
              <select
                value={newInteg.equipoId}
                onChange={e => setNewInteg({ ...newInteg, equipoId: e.target.value })}
              >
                <option value="">--Selecciona--</option>
                {equiposi.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </FormGroup>
            {['nombre','numControl','carrera','semestre','correo'].map(f => (
              <FormGroup key={f}>
                <label>{f === 'numControl' ? 'No. Control' : f.charAt(0).toUpperCase()+f.slice(1)}</label>
                <input
                  value={newInteg[f]}
                  onChange={e => setNewInteg({ ...newInteg, [f]: e.target.value })}
                />
              </FormGroup>
            ))}
            <ModalActions>
              <SecondaryButton onClick={() => setAddModalOpeni(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleAddIntegrantei}>Guardar</PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </>
  );
}

// Styled components (idénticos a tu versión, pero eliminando líneas vacías)
const ButtonRow = styled.div`display:flex;gap:10px;margin-bottom:1rem;`;
const AddButton = styled.button`
  padding:10px 20px;border:none;background:${({theme})=>theme.primary||'#347ba7'};color:#fff;border-radius:6px;cursor:pointer;
`;
const TeamsGrid = styled.div`display:flex;flex-wrap:wrap;gap:15px;`;
const TeamCard = styled.div`position:relative;background:${({theme})=>theme.bg||'#fff'};color:${({theme})=>theme.text||'#000'};padding:15px;border-radius:8px;width:200px;min-height:100px;box-shadow:0 1px 3px rgba(0,0,0,0.2);`;
const DeleteTeamButton = styled.button`
  position:absolute;top:5px;right:10px;background:transparent;border:none;color:${({theme})=>theme.text};font-size:25px;cursor:pointer;
  &:hover{color:rgb(170,42,72)}
`;
const CardContent = styled.div`height:100%;cursor:pointer;h3{margin-top:0}&:hover{opacity:0.9}`;
const ModalBackdrop = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999`;
const Modal = styled.div`background:${({theme})=>theme.bg2||'#f0f0f0'};width:95%;max-width:1000px;padding:20px;border-radius:8px;position:relative;max-height:90vh;overflow-y:auto`;
const ModalHeader = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:15px`;
const CloseButton = styled.button`background:none;border:none;font-size:24px;cursor:pointer`;
const ModalActions = styled.div`display:flex;justify-content:flex-end;gap:10px;margin-top:1rem`;
const PrimaryButton = styled.button`background:${({theme})=>theme.primary||'#347ba7'};color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer`;
const SecondaryButton = styled.button`background:${({theme})=>theme.bg2||'#eee'};border:1px solid ${({theme})=>theme.border};padding:10px 20px;border-radius:6px;cursor:pointer`;
const FormGroup = styled.div`display:flex;flex-direction:column;margin-bottom:15px;label{font-weight:bold;margin-bottom:5px}input,select{padding:8px;border:1px solid ${({theme})=>theme.border||'#ccc'};border-radius:6px}`;
const FormGroupRow = styled.div`display:flex;gap:15px;margin-bottom:15px`;
const Column = styled.div`flex:1;display:flex;flex-direction:column;gap:8px`;
const Input = styled.input`padding:8px;border:1px solid ${({theme})=>theme.border||'#ccc'};border-radius:6px`;
const TablaContainer = styled.div`max-height:300px;overflow-y:auto;border:1px solid ${({theme})=>theme.border||'#ccc'};border-radius:8px;margin-top:20px`;
const Tabla = styled.table`width:100%;border-collapse:collapse;th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd;font-size:0.9rem}th{background-color:${({theme})=>theme.bg4||'#ccc'};color:${({theme})=>theme.textsecondary||'#fff'}`;
const ActionButton = styled.button`padding:6px 12px;margin-right:5px;background:${({variant})=>variant==='danger'?'#e74c3c':'#3498db'};color:#fff;border:none;border-radius:4px;cursor:pointer;&:hover{opacity:0.9}`;