import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px 30px;
  height: 100vh;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.textprimary};
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
`;

export const SearchInput = styled.input`
  flex: 1;
  max-width: 400px;
  padding: 10px 15px;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 8px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
`;

export const ActionButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.3s;
  &:hover {
    opacity: 0.9;
  }
`;

export const EventosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

/* Modal */
export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const Modal = styled.div`
  background: ${({ theme }) => theme.bg};
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  padding: 25px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  h2 {
    margin: 0;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.textsecondary};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-weight: 500;
  }
`;

export const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
`;

export const TextArea = styled.textarea`
  padding: 10px;
  min-height: 60px;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  resize: vertical;
`;

export const Dropzone = styled.div`
  border: 2px dashed 
    ${({ theme, $hasError }) => $hasError ? theme.error : theme.border};
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
  &:hover {
    border-color: ${({ theme }) => theme.primary};
  }
`;

export const FileInfo = styled.div`
  margin-top: 10px;
  font-size: 0.9em;
  color: ${({ theme }) => theme.textsecondary};
  span + span {
    margin-left: 10px;
  }
`;

export const FileInstructions = styled.div`
  margin-top: 10px;
  font-size: 0.8em;
  color: ${({ theme }) => theme.textsecondary};
  ul {
    margin: 5px 0;
    padding-left: 20px;
  }
`;

export const TablaContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 8px;
`;

export const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.bg3};
  }
  th {
    background: ${({ theme }) => theme.bg2};
  }
`;

export const TableRow = styled.tr`
  background: ${({ theme, $hasError }) => $hasError ? 'rgba(255, 0, 0, 0.1)' : 'transparent'};
  td {
    color: ${({ theme, $hasError }) => $hasError ? theme.errorText || '#ff2b2b' : theme.text};
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
`;

export const PrimaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

export const SecondaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.bg2};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 6px;
  cursor: pointer;
`;

/* Sección de Errores en el modal */
export const ErrorContainer = styled.div`
  background: ${({ theme }) => theme.errorBg || 'rgba(255,0,0,0.1)'};
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
`;

export const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.errorText || '#ff2b2b'};
  font-size: 0.9em;
  margin: 5px 0;
`;