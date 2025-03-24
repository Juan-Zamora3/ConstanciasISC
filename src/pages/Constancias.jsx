import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Firebase
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';

// Configuración de Firebase (ajusta con tus datos)
const firebaseConfig = {
  apiKey: "AIzaSyAaXYIqtfjms2cB1N0oTyuirrJYk6qsmaw",
  authDomain: "constanciasisc.firebaseapp.com",
  projectId: "constanciasisc",
  storageBucket: "constanciasisc.appspot.com",
  messagingSenderId: "716702079630",
  appId: "1:716702079630:web:7eb7ab3fc11f67ef9c07df",
  measurementId: "G-KH8FQF19M6"
};

// Evitar inicializar Firebase más de una vez
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export function Constancias() {
  const [constancias, setConstancias] = useState([]);
  const [teams, setTeams] = useState([]); // Documentos de la colección "equipos"
  const [selectedTeams, setSelectedTeams] = useState([]); // Array de nombres de equipos seleccionados
  const [nombreConcurso, setNombreConcurso] = useState('');
  const [plantilla, setPlantilla] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar equipos desde la colección "equipos"
  useEffect(() => {
    async function fetchTeams() {
      try {
        const equiposCol = collection(db, 'equipos'); // Asegúrate de que la colección se llame "equipos"
        const snapshot = await getDocs(equiposCol);
        const teamsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Equipos obtenidos:", teamsList);
        setTeams(teamsList);
      } catch (error) {
        console.error("Error al cargar equipos:", error);
      }
    }
    fetchTeams();
  }, []);

  // Manejar la subida de la plantilla PDF
  const handlePlantillaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      // Validar que el archivo sea un PDF (que inicie con "%PDF-")
      const header = new Uint8Array(arrayBuffer.slice(0, 5));
      if (String.fromCharCode(...header) !== '%PDF-') {
        alert('El archivo seleccionado no es un PDF válido');
        return;
      }
      setPlantilla(arrayBuffer);
      alert('Plantilla subida exitosamente');
    };
    reader.readAsArrayBuffer(file);
  };

  // Función para "cargar" la plantilla (se requiere que se haya subido)
  const cargarPlantilla = async () => {
    if (!plantilla) {
      throw new Error("Debes subir la plantilla");
    }
    return plantilla;
  };

  // Función para obtener el nombre completo de un integrante a partir de su ID en la colección "integrantes"
  async function getIntegranteNombreCompleto(integranteId) {
    try {
      const ref = doc(db, 'integrantes', integranteId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return integranteId;
      const data = snap.data();
      const nombre = data.nombre || "";
      const apellidos = data.apellidos || "";
      return `${nombre} ${apellidos}`.trim();
    } catch (err) {
      console.warn("Error al obtener integrante:", err);
      return integranteId;
    }
  }

  // Función para generar la constancia usando los campos de formulario
  // Se rellenan solo "campoNombre" y "campoEquipo" con la fuente Patria (40 para nombre, 24 para equipo)
  const generarConstancia = async (nombreIntegrante, nombreEquipo, pdfTemplate) => {
    try {
      if (!nombreIntegrante || !nombreEquipo) {
        throw new Error('Faltan parámetros para generar la constancia');
      }
      if (!pdfTemplate) {
        throw new Error('No se ha cargado ninguna plantilla PDF');
      }

      const pdfDoc = await PDFDocument.load(pdfTemplate);
      pdfDoc.registerFontkit(fontkit);

      // Intentar cargar la fuente Patria (debe ser un archivo TTF válido)
      let patriaFont;
      try {
        const fontResponse = await fetch('/fonts/Patria.ttf');
        if (!fontResponse.ok) throw new Error(`Error ${fontResponse.status} cargando fuente Patria`);
        const fontBytes = await fontResponse.arrayBuffer();
        patriaFont = await pdfDoc.embedFont(fontBytes);
      } catch (fontError) {
        console.warn('No se pudo cargar la fuente Patria, usando Helvetica.', fontError);
        patriaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      const form = pdfDoc.getForm();
      try {
        // Se asume que el PDF tiene los campos "campoNombre" y "campoEquipo"
        const campoNombre = form.getTextField('campoNombre');
        const campoEquipo = form.getTextField('campoEquipo');

        // Rellenar los campos
        campoNombre.setText(nombreIntegrante);
        campoEquipo.setText(nombreEquipo);

        // Actualizar apariencias: fuente Patria, tamaño 40 para nombre, 24 para equipo.
        // **Nota:** La alineación (centrado) y la eliminación de bordes se deben configurar en el diseño del campo en la plantilla.
        campoNombre.updateAppearances(patriaFont, {
          fontSize: 40,
          textColor: rgb(0, 0, 0),
        });
        campoEquipo.updateAppearances(patriaFont, {
          fontSize: 24,
          textColor: rgb(0, 0, 0),
        });

        // Aplanar el formulario para que no se vean los bordes ni las marcas de los campos.
        form.flatten();
      } catch (error) {
        console.warn('El PDF no contiene los campos "campoNombre" y/o "campoEquipo".', error);
      }

      const pdfBytes = await pdfDoc.save();
      if (!pdfBytes || pdfBytes.length < 1024) {
        throw new Error('El PDF generado está vacío o corrupto');
      }

      return new Blob([pdfBytes], {
        type: 'application/pdf',
        endings: 'transparent'
      });
    } catch (error) {
      console.error('Error al generar constancia:', error);
      throw error;
    }
  };

  // Función que genera constancias para cada integrante de cada equipo seleccionado y descarga un ZIP
  const handleGenerar = async () => {
    try {
      if (selectedTeams.length === 0) {
        alert("Debes seleccionar al menos un equipo");
        return;
      }
      if (!plantilla) {
        alert("Debes subir la plantilla PDF");
        return;
      }
      if (!nombreConcurso) {
        alert("Debes escribir el nombre del concurso");
        return;
      }

      const plantillaBytes = await cargarPlantilla();
      const zip = new JSZip();

      // Recorrer cada equipo seleccionado
      for (const teamName of selectedTeams) {
        const team = teams.find(t => t.nombre === teamName);
        if (!team) throw new Error(`Equipo ${teamName} no encontrado`);

        // Suponemos que team.integrantes es un array de IDs de la colección "integrantes"
        for (const integranteId of team.integrantes) {
          const nombreCompleto = await getIntegranteNombreCompleto(integranteId);
          const pdfBlob = await generarConstancia(nombreCompleto, team.nombre, plantillaBytes);
          // Usar el nombre completo en lugar del ID para el archivo (reemplazando espacios)
          zip.file(`CONSTANCIA_${team.nombre}_${nombreCompleto.replace(/ /g, '_')}.pdf`, pdfBlob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'constancias.zip');

      // Registrar historial en Firestore (opcional)
      const historialEntry = {
        equipos: selectedTeams,
        concurso: nombreConcurso,
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
      await addDoc(collection(db, 'historial'), historialEntry);
      setConstancias(prev => [...prev, { id: Date.now(), ...historialEntry }]);

    } catch (error) {
      console.error('Error generando constancias:', error);
      alert(`Error al generar constancias: ${error.message}`);
    }
  };

  // Handler para el multi-select de equipos
  const handleTeamsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedTeams(selectedOptions);
  };

  return (
    <Container>
      <Header>
        <h1>Generador de Constancias</h1>
      </Header>

      <FormContainer>
        <FormGroup>
          <label>Subir Plantilla (PDF)</label>
          <HiddenFileInput
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handlePlantillaUpload}
          />
          <UploadButton onClick={() => fileInputRef.current.click()}>
            Agregar Archivo de Plantilla
          </UploadButton>
        </FormGroup>

        <FormGroup>
          <label>Nombre del Concurso</label>
          <Input
            type="text"
            value={nombreConcurso}
            onChange={(e) => setNombreConcurso(e.target.value)}
            placeholder="Ej: Concurso de Programación 2025"
          />
        </FormGroup>

        <FormGroup>
          <label>Seleccionar Equipos</label>
          <Select multiple value={selectedTeams} onChange={handleTeamsChange}>
            {teams.map(team => (
              <option key={team.id} value={team.nombre}>
                {team.nombre}
              </option>
            ))}
          </Select>
        </FormGroup>

        <ActionButton
          onClick={handleGenerar}
          disabled={selectedTeams.length === 0 || !nombreConcurso || !plantilla}
        >
          Generar Constancias y Descargar ZIP
        </ActionButton>
      </FormContainer>

      <HistorySection>
        <h2>Historial de Generación</h2>
        <Table>
          <thead>
            <tr>
              <th>Equipos</th>
              <th>Concurso</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {constancias.map(constancia => (
              <tr key={constancia.id}>
                <td>{constancia.equipos.join(', ')}</td>
                <td>{constancia.concurso}</td>
                <td>{constancia.fecha}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </HistorySection>
    </Container>
  );
}

// ESTILOS

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    color: ${({ theme }) => theme.primary};
    font-size: 2.5rem;
  }
`;

const FormContainer = styled.div`
  background: ${({ theme }) => theme.bgLight};
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.textPrimary};
  }

  select {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.bgPrimary};
    font-size: 1rem;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  padding: 0.8rem 1rem;
  background: ${({ theme }) => theme.secondary || '#555'};
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 0.5rem;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.9;
  }
`;

const Select = styled.select``;

const ActionButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: ${({ theme }) => theme.disabled};
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 0.8rem;
  width: 100%;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  font-size: 1rem;
`;

const HistorySection = styled.section`
  margin-top: 2rem;

  h2 {
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.textPrimary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.bgPrimary};
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  th {
    background: ${({ theme }) => theme.bgSecondary};
    font-weight: 600;
  }

  tr:hover {
    background: ${({ theme }) => theme.bgHover};
  }
`;
