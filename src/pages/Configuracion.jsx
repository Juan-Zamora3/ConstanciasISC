import { useState } from 'react';
import styled from 'styled-components';

export function Configuracion() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Datos de ejemplo del usuario
  const userData = {
    nombre: "Ana Pérez",
    email: "ana.perez@example.com",
    rol: "Administrador"
  };

  return (
    <Container>
      <Header>
        <h1>Configuración de Cuenta</h1>
      </Header>

      <UserInfoSection>
        <InfoCard>
          <InfoItem>
            <Label>Nombre:</Label>
            <Value>{userData.nombre}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Correo electrónico:</Label>
            <Value>{userData.email}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Rol:</Label>
            <Value>{userData.rol}</Value>
          </InfoItem>
        </InfoCard>

        <ActionButton onClick={() => setIsPasswordModalOpen(true)}>
          Cambiar Contraseña
        </ActionButton>
      </UserInfoSection>

      {/* Modal para cambiar contraseña */}
      {isPasswordModalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Cambiar Contraseña</h2>
              <CloseButton onClick={() => setIsPasswordModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <Form>
              <FormGroup>
                <Label>Contraseña actual</Label>
                <Input type="password" placeholder="••••••••" />
              </FormGroup>
              
              <FormGroup>
                <Label>Nueva contraseña</Label>
                <Input type="password" placeholder="••••••••" />
              </FormGroup>

              <FormGroup>
                <Label>Confirmar nueva contraseña</Label>
                <Input type="password" placeholder="••••••••" />
              </FormGroup>

              <ModalActions>
                <SecondaryButton onClick={() => setIsPasswordModalOpen(false)}>
                  Cancelar
                </SecondaryButton>
                <ActionButton>Guardar Cambios</ActionButton>
              </ModalActions>
            </Form>
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
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.textprimary};
`;

const Header = styled.div`
  margin-bottom: 30px;
  h1 {
    font-size: ${({ theme }) => theme.fontxl};
    margin: 0;
  }
`;

const UserInfoSection = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.bgtgderecha};
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.bg4};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const Label = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.texttertiary};
  margin-right: 15px;
`;

const Value = styled.span`
  color: ${({ theme }) => theme.textprimary};
  word-break: break-all;
`;

const ActionButton = styled.button`
  padding: 10px 25px;
  background-color: ${({ theme }) => theme.bg4};
  color: ${({ theme }) => theme.textsecondary};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 200px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

// Estilos reutilizables de modales (pueden moverse a un archivo aparte)
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
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontlg};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.texttertiary};
  &:hover {
    color: ${({ theme }) => theme.textprimary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.bg4};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.textprimary};
  &:focus {
    outline: 2px solid ${({ theme }) => theme.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
`;

const SecondaryButton = styled.button`
  padding: 8px 20px;
  background: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.textprimary};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;
