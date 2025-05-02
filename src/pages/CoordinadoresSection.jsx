import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function CoordinadoresSection({ eventoId }) {
  const [coordinadores, setCoordinadores] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const tipos = [
    'Coordinador General',
    'coordinador vinculación',
    'coordinador de reconocimientos',
    'jurado',
    'coordinador edecanes',
    'edecanes',
    'logística',
    'logística',
    'moderadores',
    'maestro de ceremonia',
    'jurado'
  ];
  const [newCoord, setNewCoord] = useState({ nombre: '', correo: '', tipo: tipos[0] });
  const [selCoord, setSelCoord] = useState(null);

  useEffect(() => {
    if (!eventoId) return;
    const q = query(
      collection(db, 'coordinadores'),
      where('eventoId', '==', eventoId)
    );
    return onSnapshot(q, snap =>
      setCoordinadores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [eventoId]);

  const openAdd = () => {
    setNewCoord({ nombre: '', correo: '', tipo: tipos[0] });
    setAddOpen(true);
  };

  const saveNew = async () => {
    const { nombre, correo, tipo } = newCoord;
    if (!nombre.trim() || !correo.trim() || !tipo) return alert('Completa todos los campos');
    await addDoc(collection(db, 'coordinadores'), { eventoId, nombre, correo, tipo });
    setAddOpen(false);
  };

  const openEdit = coord => {
    setSelCoord(coord);
    setNewCoord({ nombre: coord.nombre, correo: coord.correo, tipo: coord.tipo });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, 'coordinadores', selCoord.id), { ...newCoord });
    setEditOpen(false);
  };

  const del = async id => {
    if (!confirm('Eliminar coordinador?')) return;
    await deleteDoc(doc(db, 'coordinadores', id));
  };

  return (
    <>
      <ButtonRow>
        <AddButton onClick={openAdd}>+ Agregar Coordinador</AddButton>
      </ButtonRow>

      <Grid>
        {coordinadores.map(c => (
          <Card key={c.id}>
            <DelBtn danger onClick={() => del(c.id)}>×</DelBtn>
            <CardContent onClick={() => openEdit(c)}>
              <h4>{c.nombre}</h4>
              <p>{c.correo}</p>
              <small>{c.tipo}</small>
            </CardContent>
          </Card>
        ))}
      </Grid>

      {/* Modal Añadir */}
      {addOpen && (
        <ModalBG>
          <Modal>
            <Header>
              <h2>Nuevo Coordinador</h2>
              <Close onClick={() => setAddOpen(false)}>×</Close>
            </Header>
            <FormGroup>
              <label>Nombre</label>
              <Input
                value={newCoord.nombre}
                onChange={e => setNewCoord({ ...newCoord, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <Input
                type="email"
                value={newCoord.correo}
                onChange={e => setNewCoord({ ...newCoord, correo: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Tipo</label>
              <Select
                value={newCoord.tipo}
                onChange={e => setNewCoord({ ...newCoord, tipo: e.target.value })}
              >
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
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
              <h2>Editar Coordinador</h2>
              <Close onClick={() => setEditOpen(false)}>×</Close>
            </Header>
            <FormGroup>
              <label>Nombre</label>
              <Input
                value={newCoord.nombre}
                onChange={e => setNewCoord({ ...newCoord, nombre: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <Input
                type="email"
                value={newCoord.correo}
                onChange={e => setNewCoord({ ...newCoord, correo: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Tipo</label>
              <Select
                value={newCoord.tipo}
                onChange={e => setNewCoord({ ...newCoord, tipo: e.target.value })}
              >
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
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

// Styled components (idénticos en estilo a MaestrosSection)
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
  border-radius:6px;height:40px;
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
