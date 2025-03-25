import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from '../components/Card'; // Asegúrate de importar tu componente Card
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

export function Eventos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [eventoData, setEventoData] = useState({
    nombre: '',
    archivo: null,
    datos: []
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: files => handleFileUpload(files[0])
  });

  const handleFileUpload = file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Validar cabeceras
      const headers = jsonData[0].map(h => h.toLowerCase());
      const requiredHeaders = ['nombre del equipo', 'alumnos', 'num. control', 'carrera', 'semestre', 'correo'];
      
      if (!requiredHeaders.every(h => headers.includes(h.toLowerCase()))) {
        alert('El archivo no tiene las columnas requeridas');
        return;
      }

      const datos = jsonData.slice(1).map(row => ({
        equipo: row[0],
        alumnos: row[1],
        numControl: row[2],
        carrera: row[3],
        semestre: row[4],
        correo: row[5]
      }));

      setEventoData(prev => ({
        ...prev,
        archivo: file,
        datos
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGuardar = () => {
    if (!eventoData.nombre || eventoData.datos.length === 0) {
      alert('Completa todos los campos requeridos');
      return;
    }

    const nuevoEvento = {
      id: Date.now(),
      nombre: eventoData.nombre,
      fecha: new Date().toLocaleDateString('es-MX'),
      participantes: eventoData.datos
    };

    setEventos([...eventos, nuevoEvento]);
    setModalOpen(false);
    setEventoData({ nombre: '', archivo: null, datos: [] });
  };

  return (
    <Container>
      <Header>
        <SearchInput placeholder="Buscar eventos..." />
        <ActionButton onClick={() => setModalOpen(true)}>
          + Nuevo Evento
        </ActionButton>
      </Header>

      <EventosGrid>
        {eventos.map(evento => (
          <Card 
            key={evento.id}
            title={evento.nombre}
            date={evento.fecha}
          />
        ))}
      </EventosGrid>

      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Crear Nuevo Evento</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <label>Nombre del Evento</label>
              <Input 
                value={eventoData.nombre}
                onChange={(e) => setEventoData({...eventoData, nombre: e.target.value})}
                placeholder="Ej: Hackathon 2024"
              />
            </FormGroup>

            <FormGroup>
              <label>Importar participantes desde Excel</label>
              <Dropzone {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Arrastra tu archivo aquí o haz click para seleccionar</p>
                {eventoData.archivo && <p>{eventoData.archivo.name}</p>}
              </Dropzone>
            </FormGroup>

            {eventoData.datos.length > 0 && (
              <TablaContainer>
                <Tabla>
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Alumnos</th>
                      <th>No. Control</th>
                      <th>Carrera</th>
                      <th>Semestre</th>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventoData.datos.map((dato, index) => (
                      <tr key={index}>
                        <td>{dato.equipo}</td>
                        <td>{dato.alumnos}</td>
                        <td>{dato.numControl}</td>
                        <td>{dato.carrera}</td>
                        <td>{dato.semestre}</td>
                        <td>{dato.correo}</td>
                      </tr>
                    ))}
                  </tbody>
                </Tabla>
              </TablaContainer>
            )}

            <ModalActions>
              <SecondaryButton onClick={() => setModalOpen(false)}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleGuardar}>
                Guardar Evento
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

// Estilos
const Container = styled.div`
  padding: 20px 30px;
  height: 100vh;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.textprimary};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 400px;
  padding: 10px 15px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
`;

const ActionButton = styled.button`
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

const EventosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
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
  z-index: 1000;
`;

const Modal = styled.div`
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  h2 {
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.textsecondary};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: 500;
  }
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
`;

const Dropzone = styled.div`
  border: 2px dashed ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;

  &:hover {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const TablaContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  th {
    background: ${({ theme }) => theme.bgsecondary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
`;

const PrimaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.bgsecondary};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  cursor: pointer;
`;