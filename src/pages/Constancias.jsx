import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Firebase
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAaXYIqtfjms2cB1N0oTyuirrJYk6qsmaw",
  authDomain: "constanciasisc.firebaseapp.com",
  projectId: "constanciasisc",
  storageBucket: "constanciasisc.appspot.com",
  messagingSenderId: "716702079630",
  appId: "1:716702079630:web:7eb7ab3fc11f67ef9c07df",
  measurementId: "G-KH8FQF19M6"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export function Constancias() {
  const [constancias, setConstancias] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [nombreConcurso, setNombreConcurso] = useState('');
  const [plantilla, setPlantilla] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar equipos desde Firestore
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const equiposCol = collection(db, 'equipos');
        const snapshot = await getDocs(equiposCol);
        const teamsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(teamsList);
      } catch (error) {
        console.error("Error al cargar equipos:", error);
      }
    };
    fetchTeams();
  }, []);

  // Manejar la subida del PDF
  const handlePlantillaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const header = new Uint8Array(arrayBuffer.slice(0, 5));
      
      if (String.fromCharCode(...header) !== '%PDF-') {
        alert('El archivo seleccionado no es un PDF válido');
        return;
      }

      setPlantilla(arrayBuffer);
      alert('Plantilla cargada correctamente');
    } catch (error) {
      console.error('Error al procesar PDF:', error);
      alert('Error al cargar el PDF: ' + error.message);
    }
  };

  const getIntegranteNombreCompleto = async (integranteId) => {
    try {
      const ref = doc(db, 'integrantes', integranteId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return integranteId;
      const data = snap.data();
      return `${data.nombre || ""} ${data.apellidos || ""}`.trim();
    } catch (err) {
      console.warn("Error al obtener integrante:", err);
      return integranteId;
    }
  };

  const generarConstancia = async (nombreIntegrante, nombreEquipo, pdfTemplate) => {
    try {
      const pdfDoc = await PDFDocument.load(pdfTemplate);
      pdfDoc.registerFontkit(fontkit);

      // Intentar cargar fuente personalizada o usar Helvetica
      let customFont;
      try {
        const fontResponse = await fetch('/fonts/GolosText-VariableFont_wght.ttf');
        const fontBytes = await fontResponse.arrayBuffer();
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch {
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // Manejar campos de formulario automáticamente
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      // Intenta encontrar campos que coincidan con "nombre" o "equipo"
      fields.forEach(field => {
        const fieldName = field.getName().toLowerCase();
        
        if (fieldName.includes('nombre')) {
          field.setText(nombreIntegrante);
        } else if (fieldName.includes('equipo')) {
          field.setText(nombreEquipo);
        }
      });

      // Si no hay campos de formulario, dibujar texto en posiciones predeterminadas
      if (fields.length === 0) {
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Dibujar nombre (tamaño 40, centrado, fuente Patria)
        const nombreTextWidth = customFont.widthOfTextAtSize(nombreIntegrante, 40);
        firstPage.drawText(nombreIntegrante, {
          x: (width - nombreTextWidth) / 2,
          y: height / 2 + 50,
          size: 40,
          font: customFont,
          color: rgb(0, 0, 0),
        });

        // Dibujar equipo (tamaño 20, centrado, fuente Patria)
        const equipoTextWidth = customFont.widthOfTextAtSize(nombreEquipo, 20);
        firstPage.drawText(nombreEquipo, {
          x: (width - equipoTextWidth) / 2,
          y: height / 2 - 50,
          size: 20,
          font: customFont,
          color: rgb(0, 0, 0),
        });
      }

      form.flatten();
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error al generar constancia:', error);
      throw error;
    }
  };

  const handleGenerar = async () => {
    if (!selectedTeams.length || !plantilla || !nombreConcurso) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      const zip = new JSZip();

      for (const teamName of selectedTeams) {
        const team = teams.find(t => t.nombre === teamName);
        if (!team) continue;

        for (const integranteId of team.integrantes) {
          const nombreCompleto = await getIntegranteNombreCompleto(integranteId);
          const pdfBlob = await generarConstancia(nombreCompleto, team.nombre, plantilla);
          zip.file(`CONSTANCIA_${team.nombre}_${nombreCompleto.replace(/ /g, '_')}.pdf`, pdfBlob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `constancias_${nombreConcurso.replace(/ /g, '_')}.zip`);

      // Registrar en historial
      await addDoc(collection(db, 'historial'), {
        equipos: selectedTeams,
        concurso: nombreConcurso,
        fecha: new Date().toISOString(),
        cantidad: selectedTeams.reduce((acc, teamName) => {
          const team = teams.find(t => t.nombre === teamName);
          return acc + (team?.integrantes?.length || 0);
        }, 0)
      });

    } catch (error) {
      console.error('Error generando constancias:', error);
      alert(`Error al generar constancias: ${error.message}`);
    }
  };

  const handleTeamsChange = (e) => {
    setSelectedTeams(Array.from(e.target.selectedOptions).map(option => option.value));
  };

  return (
    <Container>
      <Header>
        <h1>Generador de Constancias</h1>
        <p>Sube un PDF con campos editables para generar constancias automáticamente</p>
      </Header>

      <FormContainer>
        <FormGroup>
          <label>Plantilla PDF (con campos editables)</label>
          <HiddenFileInput
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handlePlantillaUpload}
          />
          <UploadButton onClick={() => fileInputRef.current.click()}>
            {plantilla ? 'Plantilla Cargada ✔' : 'Seleccionar Plantilla'}
          </UploadButton>
        </FormGroup>

        <FormGroup>
          <label>Nombre del Evento/Concurso</label>
          <Input
            type="text"
            value={nombreConcurso}
            onChange={(e) => setNombreConcurso(e.target.value)}
            placeholder="Ej: Concurso Nacional de Programación 2025"
          />
        </FormGroup>

        <FormGroup>
          <label>Seleccionar Equipos (Múltiple)</label>
          <Select multiple value={selectedTeams} onChange={handleTeamsChange}>
            {teams.map(team => (
              <option key={team.id} value={team.nombre}>
                {team.nombre} ({team.integrantes?.length || 0} integrantes)
              </option>
            ))}
          </Select>
        </FormGroup>

        <ActionButton
          onClick={handleGenerar}
          disabled={!selectedTeams.length || !nombreConcurso || !plantilla}
        >
          Generar Constancias ({selectedTeams.reduce((acc, teamName) => {
            const team = teams.find(t => t.nombre === teamName);
            return acc + (team?.integrantes?.length || 0);
          }, 0)} archivos)
        </ActionButton>
      </FormContainer>

      <HistorySection>
        <h2>Historial de Generación</h2>
        <Table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Equipos</th>
              <th>Constancias</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {constancias.map((item, index) => (
              <tr key={index}>
                <td>{item.concurso}</td>
                <td>{item.equipos.join(', ')}</td>
                <td>{item.cantidad}</td>
                <td>{new Date(item.fecha).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </HistorySection>
    </Container>
  );
}

// Estilos simplificados
const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    color: #2c3e50;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #7f8c8d;
    font-size: 1.1rem;
  }
`;

const FormContainer = styled.div`
  background: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #34495e;
    font-size: 0.95rem;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  padding: 0.8rem 1.2rem;
  background: ${props => props.children.includes('✔') ? '#27ae60' : '#3498db'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: ${props => props.children.includes('✔') ? '#219653' : '#2980b9'};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  background: white;
  font-size: 1rem;
  min-height: 120px;
  
  option {
    padding: 0.5rem;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover {
    background: #219653;
  }

  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 0.8rem;
  width: 100%;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  font-size: 1rem;
  transition: border 0.2s;

  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const HistorySection = styled.section`
  margin-top: 3rem;

  h2 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ecf0f1;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 6px;
  overflow: hidden;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ecf0f1;
  }

  th {
    background: #34495e;
    color: white;
    font-weight: 500;
  }

  tr:hover {
    background: #f8f9fa;
  }

  td {
    color: #34495e;
    font-size: 0.95rem;
  }
`;
