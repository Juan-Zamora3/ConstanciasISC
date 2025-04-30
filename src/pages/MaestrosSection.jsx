// src/pages/MaestrosSection.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function MaestrosSection({ eventoId }) {
  const [maestros, setMaestros] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newMaestro, setNewMaestro] = useState({
    nombre: '', correo: '', academias: []
  });
  const [selMaestro, setSelMaestro] = useState(null);

  const academiasOpts = [
    'Sistemas', 'Ing. Civil', 'Ing. Industrial',
    'Inglés', 'Lic. Admin', 'Otros'
  ];

  // Carga en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'maestros'),
      where('eventoId', '==', eventoId)
    );
    return onSnapshot(q, snap =>
      setMaestros(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [eventoId]);

  // Handlers
  const openAdd = () => {
    setNewMaestro({ nombre: '', correo: '', academias: [] });
    setAddOpen(true);
  };
  const saveNew = async () => {
    const { nombre, correo, academias } = newMaestro;
    if (!nombre.trim() || !correo.trim() || academias.length === 0)
      return alert('Completa todos los campos');
    await addDoc(collection(db, 'maestros'), {
      eventoId, nombre, correo, academias
    });
    setAddOpen(false);
  };
  const openEdit = m => {
    setSelMaestro(m);
    setNewMaestro({
      nombre: m.nombre,
      correo: m.correo,
      academias: m.academias || []
    });
    setEditOpen(true);
  };
  const saveEdit = async () => {
    const { id } = selMaestro;
    await updateDoc(doc(db, 'maestros', id), { ...newMaestro });
    setEditOpen(false);
  };
  const del = async id => {
    if (!confirm('Eliminar maestro?')) return;
    await deleteDoc(doc(db, 'maestros', id));
  };

  const handleAcademiasChange = e => {
    const opts = Array.from(e.target.selectedOptions, o => o.value);
    setNewMaestro({ ...newMaestro, academias: opts });
  };

  return (
    <>
      <ButtonRow>
        <AddButton onClick={openAdd}>+ Agregar Maestro</AddButton>
      </ButtonRow>

      <Grid>
        {maestros.map(m => (
          <Card key={m.id}>
            <DelBtn danger onClick={() => del(m.id)}>×</DelBtn>
            <CardContent onClick={() => openEdit(m)}>
              <h4>{m.nombre}</h4>
              <p>{m.correo}</p>
              <small>{(m.academias || []).join(', ')}</small>
            </CardContent>
          </Card>
        ))}
      </Grid>

      {/* Modal Añadir */}
      {addOpen && (
        <ModalBG>
          <Modal>
            <Header>
              <h2>Nuevo Maestro</h2>
              <Close onClick={() => setAddOpen(false)}>×</Close>
            </Header>
            <FormGroup>
              <label>Nombre</label>
              <Input
                value={newMaestro.nombre}
                onChange={e => setNewMaestro({ ...newMaestro, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <Input
                value={newMaestro.correo}
                onChange={e => setNewMaestro({ ...newMaestro, correo: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Academias</label>
              <Select
                multiple
                value={newMaestro.academias}
                onChange={handleAcademiasChange}
              >
                {academiasOpts.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </FormGroup>
            <Actions>
              <Secondary onClick={() => setAddOpen(false)}>Cancelar</Secondary>
              <Primary onClick={saveNew}>Guardar</Primary>
            </Actions>
          </Modal>
        </ModalBG>
      )}

      {/* Modal Editar */}
      {editOpen && (
        <ModalBG>
          <Modal>
            <Header>
              <h2>Editar Maestro</h2>
              <Close onClick={() => setEditOpen(false)}>×</Close>
            </Header>
            <FormGroup>
              <label>Nombre</label>
              <Input
                value={newMaestro.nombre}
                onChange={e => setNewMaestro({ ...newMaestro, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <Input
                value={newMaestro.correo}
                onChange={e => setNewMaestro({ ...newMaestro, correo: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Academias</label>
              <Select
                multiple
                value={newMaestro.academias}
                onChange={handleAcademiasChange}
              >
                {academiasOpts.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </FormGroup>
            <Actions>
              <Secondary onClick={() => setEditOpen(false)}>Cancelar</Secondary>
              <Primary onClick={saveEdit}>Guardar Cambios</Primary>
            </Actions>
          </Modal>
        </ModalBG>
      )}
    </>
  );
}

// Styled components (idénticos en estilo a EquiposSection)
const ButtonRow = styled.div`display:flex;gap:10px;margin-bottom:1rem;`;
const AddButton = styled.button`
  padding:10px 20px;border:none;background:${({theme})=>theme.primary||'#347ba7'};
  color:#fff;border-radius:6px;cursor:pointer;
`;
const Grid = styled.div`display:flex;flex-wrap:wrap;gap:15px;`;
const Card = styled.div`
  position:relative;background:${({theme})=>theme.bg||'#fff'};
  padding:15px;border-radius:8px;width:200px;min-height:100px;
  box-shadow:0 1px 3px rgba(0,0,0,0.2);
`;
const DelBtn = styled.button`
  position:absolute;top:5px;right:10px;background:transparent;
  border:none;color:${({theme})=>theme.text};font-size:25px;cursor:pointer;
  &:hover{color:rgb(170,42,72)}
`;
const CardContent = styled.div`
  cursor:pointer;
  h4{margin:0 0 5px}
  p{margin:0;font-size:0.9rem;color:#555}
  small{color:#777}
`;
const ModalBG = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;z-index:999;
`;
const Modal = styled.div`
  background:${({theme})=>theme.bg2||'#f0f0f0'};
  padding:20px;border-radius:8px;max-width:400px;width:90%;
`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;`;
const Close = styled.button`background:none;border:none;font-size:24px;cursor:pointer;`;
const FormGroup = styled.div`display:flex;flex-direction:column;margin-bottom:15px;label{font-weight:bold;margin-bottom:5px}`;
const Input = styled.input`padding:8px;border:1px solid ${({theme})=>theme.border||'#ccc'};border-radius:6px;`;
const Select = styled.select`
  padding:8px;border:1px solid ${({theme})=>theme.border||'#ccc'};
  border-radius:6px;height:100px;
`;
const Actions = styled.div`display:flex;justify-content:flex-end;gap:10px;`;
const Primary = styled.button`
  background:${({theme})=>theme.primary||'#347ba7'};color:#fff;
  border:none;padding:10px 20px;border-radius:6px;cursor:pointer;
`;
const Secondary = styled.button`
  background:${({theme})=>theme.bg2||'#eee'};border:1px solid ${({theme})=>theme.border||'#ccc'};
  padding:10px 20px;border-radius:6px;cursor:pointer;
`;