import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

// IMPORTA TU COMPONENTE Card
import Card from '../components/Card';

export function Eventos() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [eventoData, setEventoData] = useState({
    nombre: '',
    descripcion: '',
    archivo: null,
    datos: [],
    errores: []
  });
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false, // Solo un archivo a la vez
    onDrop: files => handleFileUpload(files[0])
  });

  // Manejo de la carga de archivo
  const handleFileUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Cabeceras obligatorias
      const requiredHeaders = [
        'Nombre del Equipo',
        'Alumnos',
        'Num. Control',
        'Carrera',
        'Semestre',
        'Correo'
      ];

      // Leemos la primera fila del Excel como cabeceras
      const headers = jsonData[0].map(h => h?.toString().trim());
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      // Validación de cabeceras
      if (missingHeaders.length > 0) {
        setEventoData(prev => ({
          ...prev,
          errores: [`Faltan columnas requeridas: ${missingHeaders.join(', ')}`]
        }));
        return;
      }

      // Procesar filas (a partir de la segunda)
      const datosProcesados = jsonData.slice(1).map((row, index) => {
        const errorMessages = [];
        const rowData = {
          equipo: row[0]?.toString().trim() || '',
          alumnos: row[1]?.toString().trim() || '',
          numControl: row[2]?.toString().trim() || '',
          carrera: row[3]?.toString().trim() || '',
          semestre: row[4]?.toString().trim() || '',
          correo: row[5]?.toString().trim() || '',
          errores: []
        };

        // Validaciones mínimas de ejemplo
        if (!rowData.equipo) errorMessages.push('Equipo requerido');
        if (!rowData.alumnos) errorMessages.push('Alumnos requeridos');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.correo)) {
          errorMessages.push('Correo inválido');
        }

        return {
          ...rowData,
          errores: errorMessages,
          id: index + 1
        };
      });

      // Actualizamos estado
      setEventoData(prev => ({
        ...prev,
        archivo: file,
        datos: datosProcesados,
        errores: []
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  // Guardar el evento
  const handleGuardar = () => {
    const erroresGenerales = [];
    if (!eventoData.nombre) {
      erroresGenerales.push('Nombre del evento es requerido');
    }
    // Verificamos si hay filas con errores
    const tieneErroresEnFilas = eventoData.datos.some(d => d.errores.length > 0);
    if (tieneErroresEnFilas) {
      erroresGenerales.push('Existen errores en los datos del archivo');
    }

    if (erroresGenerales.length > 0) {
      setEventoData(prev => ({
        ...prev,
        errores: erroresGenerales
      }));
      return;
    }

    // Creamos un nuevo evento
    const nuevoEvento = {
      id: Date.now(),
      nombre: eventoData.nombre,
      descripcion: eventoData.descripcion,
      fecha: new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      participantes: eventoData.datos
    };

    setEventos([...eventos, nuevoEvento]);
    setModalOpen(false);

    // Limpiamos el estado
    setEventoData({
      nombre: '',
      descripcion: '',
      archivo: null,
      datos: [],
      errores: []
    });
  };

  return (
    <Container>
      <Header>
        <SearchInput placeholder="Buscar eventos..." />
        <ActionButton onClick={() => setModalOpen(true)}>
          + Nuevo Evento
        </ActionButton>
      </Header>

      {/* Grid de eventos con Card */}
      <EventosGrid>
        {eventos.map(evento => (
          <Card
            key={evento.id}
            id={evento.id}
            title={evento.nombre}
            date={evento.fecha}
            description={evento.descripcion}
            onClick={() => setEventoSeleccionado(evento)}
          />
        ))}
      </EventosGrid>

      {/* Modal de creación de evento */}
      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>Crear Nuevo Evento</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            {/* Sección de errores en el modal */}
            {eventoData.errores.length > 0 && (
              <ErrorContainer>
                {eventoData.errores.map((error, idx) => (
                  <ErrorMessage key={idx}>⚠️ {error}</ErrorMessage>
                ))}
              </ErrorContainer>
            )}

            {/* Nombre del Evento */}
            <FormGroup>
              <label>Nombre del Evento</label>
              <Input
                value={eventoData.nombre}
                onChange={(e) =>
                  setEventoData({ ...eventoData, nombre: e.target.value })
                }
                placeholder="Ej: Hackathon 2024"
              />
            </FormGroup>

            {/* Descripción del Evento */}
            <FormGroup>
              <label>Descripción del Evento</label>
              <TextArea
                value={eventoData.descripcion}
                onChange={(e) =>
                  setEventoData({ ...eventoData, descripcion: e.target.value })
                }
                placeholder="Describe el propósito y detalles del evento"
              />
            </FormGroup>

            {/* Subir archivo Excel */}
            <FormGroup>
              <label>Subir archivo Excel</label>
              <Dropzone {...getRootProps()} $hasError={eventoData.errores.length > 0}>
                <input {...getInputProps()} />
                <p>Arrastra aquí el archivo Excel o haz click para seleccionar</p>
                {eventoData.archivo && (
                  <FileInfo>
                    <span>{eventoData.archivo.name}</span>
                    <span>({(eventoData.archivo.size / 1024).toFixed(1)} KB)</span>
                  </FileInfo>
                )}
              </Dropzone>
              <FileInstructions>
                El archivo debe contener las siguientes columnas:
                <ul>
                  <li>Nombre del Equipo</li>
                  <li>Alumnos (separados por comas)</li>
                  <li>Num. Control</li>
                  <li>Carrera</li>
                  <li>Semestre</li>
                  <li>Correo</li>
                </ul>
              </FileInstructions>
            </FormGroup>

            {/* Tabla de previsualización de datos */}
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
                      <th>Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventoData.datos.map((dato) => (
                      <TableRow key={dato.id} $hasError={dato.errores.length > 0}>
                        <td>{dato.equipo}</td>
                        <td>{dato.alumnos}</td>
                        <td>{dato.numControl}</td>
                        <td>{dato.carrera}</td>
                        <td>{dato.semestre}</td>
                        <td>{dato.correo}</td>
                        <td>
                          {dato.errores.map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </td>
                      </TableRow>
                    ))}
                  </tbody>
                </Tabla>
              </TablaContainer>
            )}

            {/* Botones de acción */}
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

      {/* Modal de detalles del evento */}
      {eventoSeleccionado && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <h2>{eventoSeleccionado.nombre}</h2>
              <CloseButton onClick={() => setEventoSeleccionado(null)}>×</CloseButton>
            </ModalHeader>
            <p><strong>Descripción:</strong> {eventoSeleccionado.descripcion}</p>
            <p><strong>Fecha:</strong> {eventoSeleccionado.fecha}</p>
            <h3>Participantes:</h3>
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
                  {eventoSeleccionado.participantes.map((participante, index) => (
                    <tr key={index}>
                      <td>{participante.equipo}</td>
                      <td>{participante.alumnos}</td>
                      <td>{participante.numControl}</td>
                      <td>{participante.carrera}</td>
                      <td>{participante.semestre}</td>
                      <td>{participante.correo}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            </TablaContainer>
            <ModalActions>
              <SecondaryButton onClick={() => setEventoSeleccionado(null)}>
                Cerrar
              </SecondaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

/*-------------------------
  ESTILOS
--------------------------*/
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
  border: 1px solid ${({ theme }) => theme.bg3};
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

/* Modal */
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
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
`;

const TextArea = styled.textarea`
  padding: 10px;
  min-height: 60px;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  resize: vertical;
`;

const Dropzone = styled.div`
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

const FileInfo = styled.div`
  margin-top: 10px;
  font-size: 0.9em;
  color: ${({ theme }) => theme.textsecondary};
  span + span {
    margin-left: 10px;
  }
`;

const FileInstructions = styled.div`
  margin-top: 10px;
  font-size: 0.8em;
  color: ${({ theme }) => theme.textsecondary};
  ul {
    margin: 5px 0;
    padding-left: 20px;
  }
`;

const TablaContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 8px;
`;

const Tabla = styled.table`
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

const TableRow = styled.tr`
  background: ${({ theme, $hasError }) => $hasError ? 'rgba(255, 0, 0, 0.1)' : 'transparent'};
  td {
    color: ${({ theme, $hasError }) => $hasError ? theme.errorText || '#ff2b2b' : theme.text};
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
  &:hover {
    opacity: 0.9;
  }
`;

const SecondaryButton = styled.button`
  padding: 10px 25px;
  background: ${({ theme }) => theme.bg2};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 6px;
  cursor: pointer;
`;

/* Sección de Errores en el modal */
const ErrorContainer = styled.div`
  background: ${({ theme }) => theme.errorBg || 'rgba(255,0,0,0.1)'};
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.errorText || '#ff2b2b'};
  font-size: 0.9em;
  margin: 5px 0;
`;
