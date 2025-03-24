import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Table, TableHeader, TableRow, TableCell, ActionButton } from '../components/TeamTable';
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

export function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  // Ahora se incluye "integrantes" como array de ids
  const [teamForm, setTeamForm] = useState({ nombre: '', categoria: '', integrantes: [] });

  // Cargar equipos desde la colección "equipos"
  useEffect(() => {
    async function fetchEquipos() {
      try {
        const equiposCol = collection(db, 'equipos');
        const snapshot = await getDocs(equiposCol);
        const equiposList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipos(equiposList);
      } catch (error) {
        console.error("Error al cargar equipos:", error);
      }
    }
    fetchEquipos();
  }, []);

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

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setTeamForm({ 
      nombre: team.nombre, 
      categoria: team.categoria,
      integrantes: team.integrantes || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTeamForm(prev => ({ ...prev, [name]: value }));
  };

  // Maneja el cambio de cada checkbox en la lista de integrantes
  const handleCheckboxChange = (e, integId) => {
    if (e.target.checked) {
      // Agregar el id si no está ya
      setTeamForm(prev => ({
        ...prev,
        integrantes: [...prev.integrantes, integId]
      }));
    } else {
      // Quitar el id del array
      setTeamForm(prev => ({
        ...prev,
        integrantes: prev.integrantes.filter(id => id !== integId)
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedTeam) {
        // Actualizar equipo existente
        const teamDoc = doc(db, 'equipos', selectedTeam.id);
        await updateDoc(teamDoc, teamForm);
        setEquipos(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, ...teamForm } : t));
      } else {
        // Agregar nuevo equipo (se guarda el array de integrantes seleccionado)
        const docRef = await addDoc(collection(db, 'equipos'), teamForm);
        setEquipos(prev => [...prev, { id: docRef.id, ...teamForm }]);
      }
      setIsModalOpen(false);
      setTeamForm({ nombre: '', categoria: '', integrantes: [] });
      setSelectedTeam(null);
    } catch (error) {
      console.error("Error al guardar el equipo:", error);
      alert("Error al guardar el equipo");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'equipos', selectedTeam.id));
      setEquipos(prev => prev.filter(t => t.id !== selectedTeam.id));
      setIsDeleteModalOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Error al eliminar el equipo:", error);
      alert("Error al eliminar el equipo");
    }
  };

  return (
    <Container>
      <Header>
        <h1>Estadísticas de Equipos</h1>
        <ActionButton onClick={() => { 
          setSelectedTeam(null); 
          setTeamForm({ nombre: '', categoria: '', integrantes: [] }); 
          setIsModalOpen(true); 
        }}>
          Agregar Equipo
        </ActionButton>
      </Header>

      <Table>
        <thead>
          <TableRow>
            <TableHeader>Nombre del equipo</TableHeader>
            <TableHeader>Categoría</TableHeader>
            <TableHeader>Integrantes</TableHeader>
            <TableHeader>Acciones</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {equipos.map((team) => {
            // Si el equipo tiene un array de integrantes (ids), se obtienen los nombres completos
            const teamIntegrantes = team.integrantes 
              ? integrantes
                  .filter(integ => team.integrantes.includes(integ.id))
                  .map(integ => `${integ.nombre} ${integ.apellidos}`)
              : [];
            return (
              <TableRow key={team.id}>
                <TableCell>{team.nombre}</TableCell>
                <TableCell>{team.categoria}</TableCell>
                <TableCell>{teamIntegrantes.join(', ')}</TableCell>
                <TableCell>
                  <ActionButton variant="info">Ver</ActionButton>
                  <ActionButton onClick={() => handleEdit(team)}>Editar</ActionButton>
                  <ActionButton variant="danger" onClick={() => handleDelete(team)}>
                    Eliminar
                  </ActionButton>
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>

      {/* Modal para agregar/editar equipo */}
      {isModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>{selectedTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
              <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSave}>
              <FormGroup>
                <label>Nombre del equipo</label>
                <Input 
                  type="text" 
                  name="nombre"
                  value={teamForm.nombre}
                  onChange={handleFormChange}
                />
              </FormGroup>
              
              <FormGroup>
                <label>Categoría</label>
                <Select 
                  name="categoria"
                  value={teamForm.categoria}
                  onChange={handleFormChange}
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="Robótica">Robótica</option>
                  <option value="Programación">Programación</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <label>Selecciona los integrantes del equipo</label>
                <CheckboxContainer>
                  {integrantes.map(integ => (
                    <CheckboxLabel key={integ.id}>
                      <Checkbox 
                        type="checkbox"
                        value={integ.id}
                        checked={teamForm.integrantes.includes(integ.id)}
                        onChange={(e) => handleCheckboxChange(e, integ.id)}
                      />
                      {integ.nombre} {integ.apellidos}
                    </CheckboxLabel>
                  ))}
                </CheckboxContainer>
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

      {/* Modal de confirmación para eliminar equipo */}
      {isDeleteModalOpen && (
        <ModalBackdrop>
          <Modal>
            <h3>¿Eliminar equipo {selectedTeam?.nombre}?</h3>
            <p>Esta acción no se puede deshacer</p>
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
  padding: 15px 30px;
  height: 100vh;
  overflow-x: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  margin-bottom: 20px;
  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 8px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  cursor: pointer;
`;
