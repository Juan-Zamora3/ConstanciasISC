// Eventos.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

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

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    onDrop: files => handleFileUpload(files[0])
  });

  const handleFileUpload = file => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Validar cabeceras
      const requiredHeaders = [
        'Nombre del Equipo', 
        'Alumnos', 
        'Num. Control', 
        'Carrera', 
        'Semestre', 
        'Correo'
      ];

      const headers = jsonData[0].map(h => h.trim());
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setEventoData(prev => ({
          ...prev,
          errores: [`Faltan columnas requeridas: ${missingHeaders.join(', ')}`]
        }));
        return;
      }

      // Procesar datos
      const datos = jsonData.slice(1).map((row, index) => {
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

        // Validaciones
        if (!rowData.equipo) errorMessages.push('Equipo requerido');
        if (!rowData.alumnos) errorMessages.push('Alumnos requeridos');
        if (!rowData.correo.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errorMessages.push('Correo inválido');
        }

        return {
          ...rowData,
          errores: errorMessages,
          id: index + 1
        };
      });

      setEventoData(prev => ({
        ...prev,
        archivo: file,
        datos,
        errores: []
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGuardar = () => {
    const erroresGenerales = [];
    if (!eventoData.nombre) erroresGenerales.push('Nombre del evento es requerido');
    if (eventoData.datos.some(d => d.errores.length > 0)) {
      erroresGenerales.push('Existen errores en los datos del archivo');
    }

    if (erroresGenerales.length > 0) {
      setEventoData(prev => ({ ...prev, errores: erroresGenerales }));
      return;
    }

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
      {/* ... (mismo header y grid de eventos que antes) */}

      {modalOpen && (
        <ModalBackdrop>
          <Modal>
            {/* ... (mismo modal header) */}

            {/* Sección de errores */}
            {eventoData.errores.length > 0 && (
              <ErrorContainer>
                {eventoData.errores.map((error, index) => (
                  <ErrorMessage key={index}>⚠️ {error}</ErrorMessage>
                ))}
              </ErrorContainer>
            )}

            {/* Campo de descripción */}
            <FormGroup>
              <label>Descripción del Evento</label>
              <TextArea
                value={eventoData.descripcion}
                onChange={(e) => setEventoData({...eventoData, descripcion: e.target.value})}
                placeholder="Describe el propósito y detalles del evento"
              />
            </FormGroup>

            {/* Dropzone para Excel */}
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

            {/* Tabla de previsualización */}
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
                      <tr key={dato.id} $hasError={dato.errores.length > 0}>
                        <td>{dato.equipo}</td>
                        <td>{dato.alumnos}</td>
                        <td>{dato.numControl}</td>
                        <td>{dato.carrera}</td>
                        <td>{dato.semestre}</td>
                        <td>{dato.correo}</td>
                        <td>
                          {dato.errores.map((error, idx) => (
                            <div key={idx}>• {error}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Tabla>
              </TablaContainer>
            )}

            {/* ... (botones de guardar/cancelar) */}
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
}

// Nuevos estilos para validación
const ErrorContainer = styled.div`
  background: ${({ theme }) => theme.errorBg};
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.errorText};
  font-size: 0.9em;
  margin: 5px 0;
`;

const FileInfo = styled.div`
  margin-top: 10px;
  font-size: 0.9em;
  color: ${({ theme }) => theme.textSecondary};
  span + span {
    margin-left: 10px;
  }
`;

const FileInstructions = styled.div`
  margin-top: 10px;
  font-size: 0.8em;
  color: ${({ theme }) => theme.textSecondary};
  ul {
    margin: 5px 0;
    padding-left: 20px;
  }
`;

// Estilos condicionales
const Dropzone = styled.div`
  border: 2px dashed 
    ${({ theme, $hasError }) => $hasError ? theme.error : theme.border};
  background: ${({ theme, $hasError }) => $hasError && theme.errorBg};
  /* ... (otros estilos) */
`;

const Tr = styled.tr`
  background: ${({ theme, $hasError }) => $hasError && theme.errorBg} !important;
  td {
    color: ${({ theme, $hasError }) => $hasError && theme.errorText} !important;
  }
`;