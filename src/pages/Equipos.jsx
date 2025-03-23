import { useState } from 'react';
import styled from 'styled-components';
import { Table, TableHeader, TableRow, TableCell, ActionButton } from '../components/TeamTable';

export function Equipos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Datos de ejemplo
  const mockTeams = [
    { id: 1, nombre: "Equipo Alpha", categoria: "Robótica", integrantes: 5 },
    { id: 2, nombre: "Equipo Beta", categoria: "Programación", integrantes: 3 },
  ];

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleDelete = (team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  return (
    <Container>
      <Header>
        <h1>Estadísticas de Equipos</h1>
        <ActionButton onClick={() => setIsModalOpen(true)}>
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
          {mockTeams.map((team) => (
            <TableRow key={team.id}>
              <TableCell>{team.nombre}</TableCell>
              <TableCell>{team.categoria}</TableCell>
              <TableCell>{team.integrantes}</TableCell>
              <TableCell>
                <ActionButton variant="info">Ver</ActionButton>
                <ActionButton onClick={() => handleEdit(team)}>Editar</ActionButton>
                <ActionButton variant="danger" onClick={() => handleDelete(team)}>
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
              <h2>{selectedTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
              <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <Form>
              <FormGroup>
                <label>Nombre del equipo</label>
                <Input type="text" defaultValue={selectedTeam?.nombre || ''} />
              </FormGroup>
              
              <FormGroup>
                <label>Categoría</label>
                <Select defaultValue={selectedTeam?.categoria || ''}>
                  <option value="">Seleccionar categoría</option>
                  <option value="Robótica">Robótica</option>
                  <option value="Programación">Programación</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <label>Integrantes</label>
                <IntegrantesList>
                  {[1, 2, 3, 4, 5].map(num => (
                    <label key={num}>
                      <input type="checkbox" /> Integrante {num}
                    </label>
                  ))}
                </IntegrantesList>
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
            <h3>¿Eliminar equipo {selectedTeam?.nombre}?</h3>
            <p>Esta acción no se puede deshacer</p>
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

// Estilos adicionales
const Container = styled.div`
  padding: 15px 30px;
  height:100vh;
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

const IntegrantesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 200px;
  overflow-y: auto;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

// Estilos responsivos
