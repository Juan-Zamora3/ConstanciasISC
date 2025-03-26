import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Table, TableHeader, TableRow, TableCell, ActionButton } from '../components/MemberTable';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
  apiKey: "AIzaSyAaXYIqtfjms2cB1N0oTyuirrJYk6qsmaw",
  authDomain: "constanciasisc.firebaseapp.com",
  projectId: "constanciasisc",
  storageBucket: "constanciasisc.appspot.com",
  messagingSenderId: "716702079630",
  appId: "1:716702079630:web:7eb7ab3fc11f67ef9c07df",
  measurementId: "G-KH8FQF19M6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function Integrantes() {
  const [integrantes, setIntegrantes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    nombre: '',
    apellidos: '',
    semestre: '',
    carrera: '',
    numeroControl: '',
    correo: ''
  });

  // Cargar integrantes desde la colección "integrantes"
  useEffect(() => {
    async function fetchIntegrantes() {
      try {
        const integrantesCol = collection(db, 'integrantes');
        const snapshot = await getDocs(integrantesCol);
        const integrantesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIntegrantes(integrantesList);
      } catch (error) {
        console.error("Error al cargar integrantes:", error);
      }
    }
    fetchIntegrantes();
  }, []);

  const handleEdit = (member) => {
    setSelectedMember(member);
    setMemberForm({
      nombre: member.nombre,
      apellidos: member.apellidos,
      semestre: member.semestre,
      carrera: member.carrera,
      numeroControl: member.numeroControl,
      correo: member.correo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedMember) {
        // Actualizar integrante existente
        const integranteDoc = doc(db, 'integrantes', selectedMember.id);
        await updateDoc(integranteDoc, memberForm);
        setIntegrantes(prev => prev.map(m => m.id === selectedMember.id ? { ...m, ...memberForm } : m));
      } else {
        // Agregar nuevo integrante
        const docRef = await addDoc(collection(db, 'integrantes'), memberForm);
        setIntegrantes(prev => [...prev, { id: docRef.id, ...memberForm }]);
      }
      setIsModalOpen(false);
      setMemberForm({
        nombre: '',
        apellidos: '',
        semestre: '',
        carrera: '',
        numeroControl: '',
        correo: ''
      });
      setSelectedMember(null);
    } catch (error) {
      console.error("Error al guardar integrante:", error);
      alert("Error al guardar el integrante");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'integrantes', selectedMember.id));
      setIntegrantes(prev => prev.filter(m => m.id !== selectedMember.id));
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error al eliminar integrante:", error);
      alert("Error al eliminar el integrante");
    }
  };

  return (
    <Container>
      <Header>
        <h1>Gestión de Integrantes</h1>
        <ActionButton onClick={() => { 
          setSelectedMember(null); 
          setMemberForm({
            nombre: '',
            apellidos: '',
            semestre: '',
            carrera: '',
            numeroControl: '',
            correo: ''
          });
          setIsModalOpen(true); 
        }}>
          Agregar Integrante
        </ActionButton>
      </Header>

      <Table>
        <thead>
          <TableRow>
            <TableHeader>Nombre</TableHeader>
            <TableHeader>Apellidos</TableHeader>
            <TableHeader>Semestre</TableHeader>
            <TableHeader>Carrera</TableHeader>
            <TableHeader>Número de Control</TableHeader>
            <TableHeader>Correo</TableHeader>
            <TableHeader>Acciones</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {integrantes.map(member => (
            <TableRow key={member.id}>
              <TableCell>{member.nombre}</TableCell>
              <TableCell>{member.apellidos}</TableCell>
              <TableCell>{member.semestre}</TableCell>
              <TableCell>{member.carrera}</TableCell>
              <TableCell>{member.numeroControl}</TableCell>
              <TableCell>{member.correo}</TableCell>
              <TableCell>
                <ActionButton variant="info">Ver</ActionButton>
                <ActionButton onClick={() => handleEdit(member)}>Editar</ActionButton>
                <ActionButton variant="danger" onClick={() => handleDelete(member)}>Eliminar</ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Modal para agregar/editar integrante */}
      {isModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>{selectedMember ? 'Editar Integrante' : 'Nuevo Integrante'}</h2>
              <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSave}>
              <FormGroup>
                <label>Nombre</label>
                <Input 
                  type="text" 
                  name="nombre"
                  value={memberForm.nombre}
                  onChange={handleFormChange}
                  placeholder="Ej: Juan"
                />
              </FormGroup>
              <FormGroup>
                <label>Apellidos</label>
                <Input 
                  type="text" 
                  name="apellidos"
                  value={memberForm.apellidos}
                  onChange={handleFormChange}
                  placeholder="Ej: Pérez López"
                />
              </FormGroup>
              <FormGroup>
                <label>Semestre</label>
                <Input 
                  type="text" 
                  name="semestre"
                  value={memberForm.semestre}
                  onChange={handleFormChange}
                  placeholder="Ej: 5to"
                />
              </FormGroup>
              <FormGroup>
                <label>Carrera</label>
                <Input 
                  type="text" 
                  name="carrera"
                  value={memberForm.carrera}
                  onChange={handleFormChange}
                  placeholder="Ej: Ingeniería en Sistemas"
                />
              </FormGroup>
              <FormGroup>
                <label>Número de Control</label>
                <Input 
                  type="text" 
                  name="numeroControl"
                  value={memberForm.numeroControl}
                  onChange={handleFormChange}
                  placeholder="Ej: 202012345"
                />
              </FormGroup>
              <FormGroup>
                <label>Correo</label>
                <Input 
                  type="email" 
                  name="correo"
                  value={memberForm.correo}
                  onChange={handleFormChange}
                  placeholder="Ej: correo@dominio.com"
                />
              </FormGroup>
              <ModalActions>
                <ActionButton type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </ActionButton>
                <ActionButton type="submit" variant="info">
                  Guardar
                </ActionButton>
              </ModalActions>
            </Form>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Modal de confirmación para eliminar integrante */}
      {isDeleteModalOpen && (
        <ModalBackdrop>
          <Modal>
            <h3>¿Eliminar a {selectedMember?.nombre} {selectedMember?.apellidos}?</h3>
            <p>Esta acción eliminará todos los datos asociados al integrante</p>
            <ModalActions>
              <ActionButton onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </ActionButton>
              <ActionButton variant="danger" onClick={handleConfirmDelete}>
                Eliminar
              </ActionButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

// Estilos
const Container = styled.div`
  height: 100vh;
  overflow-x: auto;
  background-color: ${({ theme }) => theme.bgPrimary};
  padding: 15px 30px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.bgtgderecha};
  color: ${({ theme }) => theme.textprimary};
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  
  h2, h3, p {
    color: ${({ theme }) => theme.textprimary};
  }
  
  label {
    color: ${({ theme }) => theme.texttertiary};
  }
`;


const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: ${({ theme }) => theme.textSecondary};
  &:hover {
    color: ${({ theme }) => theme.textPrimary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 500;
    color: ${({ theme }) => theme.textPrimary};
  }
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  font-size: 1rem;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.primary};
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  font-size: 1rem;
  background-color: ${({ theme }) => theme.bgSecondary};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
`;
