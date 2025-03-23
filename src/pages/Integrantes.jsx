import { useState } from 'react';
import styled from 'styled-components';
import { Table, TableHeader, TableRow, TableCell, ActionButton } from '../components/MemberTable';

export function Integrantes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Datos de ejemplo
  const mockMembers = [
    { id: 1, nombre: "Ana Pérez", email: "ana@example.com", equipo: "Equipo Alpha" },
    { id: 2, nombre: "Carlos Ruiz", email: "carlos@example.com", equipo: "Equipo Beta" },
  ];

  // Equipos ficticios para el dropdown
  const mockTeams = ["Equipo Alpha", "Equipo Beta", "Equipo Gamma"];

  const handleEdit = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  return (
    <Container>
      <Header>
        <h1>Gestión de Integrantes</h1>
        <ActionButton onClick={() => setIsModalOpen(true)}>
          Agregar Integrante
        </ActionButton>
      </Header>

      <Table>
        <thead>
          <TableRow>
            <TableHeader>Nombre</TableHeader>
            <TableHeader>Correo</TableHeader>
            <TableHeader>Equipo</TableHeader>
            <TableHeader>Acciones</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {mockMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.nombre}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.equipo}</TableCell>
              <TableCell>
                <ActionButton variant="info">Ver</ActionButton>
                <ActionButton onClick={() => handleEdit(member)}>Editar</ActionButton>
                <ActionButton variant="danger" onClick={() => handleDelete(member)}>
                  Eliminar
                </ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Modal para agregar/editar */}
      {isModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>{selectedMember ? 'Editar Integrante' : 'Nuevo Integrante'}</h2>
              <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <Form>
              <FormGroup>
                <label>Nombre completo</label>
                <Input 
                  type="text" 
                  defaultValue={selectedMember?.nombre || ''} 
                  placeholder="Ej: María González"
                />
              </FormGroup>
              
              <FormGroup>
                <label>Correo electrónico</label>
                <Input 
                  type="email" 
                  defaultValue={selectedMember?.email || ''} 
                  placeholder="Ej: ejemplo@correo.com"
                />
              </FormGroup>

              <FormGroup>
                <label>Equipo asociado</label>
                <Select defaultValue={selectedMember?.equipo || ''}>
                  <option value="">Seleccionar equipo</option>
                  {mockTeams.map((team, index) => (
                    <option key={index} value={team}>{team}</option>
                  ))}
                </Select>
              </FormGroup>

              <ModalActions>
                <ActionButton onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </ActionButton>
                <ActionButton variant="info">Guardar</ActionButton>
              </ModalActions>
            </Form>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Modal de confirmación */}
      {isDeleteModalOpen && (
        <ModalBackdrop>
          <Modal>
            <h3>¿Eliminar a {selectedMember?.nombre}?</h3>
            <p>Esta acción eliminará todos los datos asociados al integrante</p>
            <ModalActions>
              <ActionButton onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </ActionButton>
              <ActionButton variant="danger">Eliminar</ActionButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

// Estilos (similar a Estadisticas.jsx pero con mejoras)
const Container = styled.div`
  height: 100vh;
  overflow-x: auto;
  background-color: ${({ theme }) => theme.bgPrimary};
  padding: 15px 30px;
  height:100vh;;
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

