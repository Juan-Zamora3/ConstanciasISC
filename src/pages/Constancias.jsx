import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

// Si ya inicializaste Firebase afuera, reutiliza esa instancia:
import { db } from '../firebaseConfig'; // Asegúrate de apuntar a tu config real

export function Constancias() {
  // 1) Estados generales
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [teams, setTeams] = useState([]); 
  const [plantillaPDF, setPlantillaPDF] = useState(null);

  // Para los checkboxes de equipos
  const [checkedTeams, setCheckedTeams] = useState({}); // {teamId: true/false}
  
  // Checkbox (desactivado) para “enviar por correo”
  const [sendByEmail, setSendByEmail] = useState(false); // pero estará disabled
  
  // Para la previsualización
  const [pdfPreviews, setPdfPreviews] = useState([]); // array de URLs o dataURIs
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  // Referencia para subir la plantilla
  const fileInputRef = useRef(null);

  // -----------------------------------------------------------
  // 2) Cargar eventos
  // -----------------------------------------------------------
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const snap = await getDocs(collection(db, 'eventos'));
        const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(arr);
      } catch (err) {
        console.error('Error cargando eventos:', err);
      }
    };
    loadEvents();
  }, []);

  // -----------------------------------------------------------
  // 3) Cuando cambia el evento seleccionado, cargar equipos+integrantes
  // -----------------------------------------------------------
useEffect(() => {
  if (!selectedEvent) {
    setTeams([]);
    return;
  }
  const loadTeams = async () => {
    try {
      const q = query(collection(db, 'equipos'), where('eventoId', '==', selectedEvent));
      const snapTeams = await getDocs(q);
      const promises = snapTeams.docs.map(async (teamDoc) => {
        const teamData = { id: teamDoc.id, ...teamDoc.data() };
        const qInteg = query(collection(db, 'integrantes'), where('equipoId', '==', teamDoc.id));
        const snapInteg = await getDocs(qInteg);
        teamData.integrantes = snapInteg.docs.map(d => ({ id: d.id, ...d.data() }));
        return teamData;
      });

      const allTeams = await Promise.all(promises);
      setTeams(allTeams);

      // Inicialmente, todos los checkboxes en true
      const initialChecks = {};
      allTeams.forEach(t => { initialChecks[t.id] = true; });
      setCheckedTeams(initialChecks);

      // Limpiar previsualizaciones al cambiar de evento
      setPdfPreviews([]);
      setCurrentPreviewIndex(0);

      // Llamar a la generación automática
      if (plantillaPDF) {
        await handleGenerarConstancias();
      }
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  };
  loadTeams();
}, [selectedEvent]);


  // -----------------------------------------------------------
  // 4) Manejo de carga de la plantilla PDF
  // -----------------------------------------------------------
  const handlePlantillaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Comprobación rápida para ver si es PDF
      const header = new Uint8Array(arrayBuffer.slice(0, 5));
      if (String.fromCharCode(...header) !== '%PDF-') {
        alert('El archivo no es un PDF válido');
        return;
      }
      setPlantillaPDF(arrayBuffer);
    } catch (err) {
      console.error('Error leyendo PDF:', err);
      alert('Error al procesar la plantilla PDF');
    }
  };

  // -----------------------------------------------------------
  // 5) Generar TODAS las constancias y guardarlas en ZIP
  //    + preparar previsualización
  // -----------------------------------------------------------
  const handleGenerarConstancias = async () => {
    if (!plantillaPDF) {
      alert('Por favor sube una plantilla PDF primero');
      return;
    }
    // Filtrar equipos seleccionados
    const selectedTeamsList = teams.filter(t => checkedTeams[t.id]);

    // Juntar a todos los integrantes de los equipos marcados
    const allParticipants = [];
    selectedTeamsList.forEach(team => {
      team.integrantes.forEach(integ => {
        allParticipants.push({
          teamName: team.nombre,
          ...integ,
        });
      });
    });

    if (allParticipants.length === 0) {
      alert('No hay integrantes seleccionados');
      return;
    }

    try {
      // Preparamos un ZIP
      const zip = new JSZip();

      // Para la previsualización
      const previewBlobs = [];

      // Generar PDFs uno por uno
      for (let i = 0; i < allParticipants.length; i++) {
        const p = allParticipants[i];
        // Generar el PDF individual
        const pdfBytes = await generarPDFpara(p, plantillaPDF);
        // Guardar en ZIP
        const fileName = `Constancia_${p.teamName.replace(/\s/g, '_')}_${(p.nombre || '').replace(/\s/g, '_')}.pdf`;
        zip.file(fileName, pdfBytes);

        // Para la previsualización, creamos un objeto URL
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        previewBlobs.push(url);
      }

      // Almacenar para mostrar en el visor
      setPdfPreviews(previewBlobs);
      setCurrentPreviewIndex(0);

      // Descargar ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'constancias.zip');

      // Ojo: Podrías mandar un registro a "historial" u otro lugar si gustas
    } catch (error) {
      console.error('Error generando constancias:', error);
      alert('Ocurrió un error durante la generación de constancias');
    }
  };

  // -----------------------------------------------------------
  // 6) Genera un PDF para un participante (usando pdf-lib)
  //    Reutiliza la lógica previa
  // -----------------------------------------------------------
  const generarPDFpara = async (participante, pdfTemplate) => {
    try {
      const { nombre = '', teamName = '' } = participante;
      const pdfDoc = await PDFDocument.load(pdfTemplate);
      pdfDoc.registerFontkit(fontkit);

      // Intentar fuente custom, si no está, usa Helvetica
      let customFont;
      try {
        // Ejemplo: si tuvieras una fuente custom en tu servidor:
        // const fontResponse = await fetch('/fonts/GolosText-VariableFont_wght.ttf');
        // const fontBytes = await fontResponse.arrayBuffer();
        // customFont = await pdfDoc.embedFont(fontBytes);
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      } catch {
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // Si la plantilla trae formularios, intenta rellenarlos
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      if (fields.length > 0) {
        // Buscar campos "nombre" y "equipo"
        fields.forEach(field => {
          const fieldName = field.getName().toLowerCase();
          if (fieldName.includes('nombre')) field.setText(nombre);
          if (fieldName.includes('equipo')) field.setText(teamName);
        });
        // Aplanar formulario
        form.flatten();
      } else {
        // Dibujar texto en la primera página
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        // Nombre grande
        const fontSize = 30;
        const textWidth = customFont.widthOfTextAtSize(nombre, fontSize);
        page.drawText(nombre, {
          x: (width - textWidth) / 2,
          y: height / 2,
          font: customFont,
          size: fontSize,
          color: rgb(0, 0, 0),
        });

        // Nombre equipo abajo
        const teamTextSize = 15;
        const teamTextWidth = customFont.widthOfTextAtSize(teamName, teamTextSize);
        page.drawText(teamName, {
          x: (width - teamTextWidth) / 2,
          y: (height / 2) - 40,
          font: customFont,
          size: teamTextSize,
          color: rgb(0, 0, 0),
        });
      }

      return await pdfDoc.save();
    } catch (err) {
      console.error('Error generando PDF individual:', err);
      throw err;
    }
  };

  // -----------------------------------------------------------
  // 7) Render principal
  // -----------------------------------------------------------
  // Funciones para la tabla de equipos con checkboxes
  const toggleCheckTeam = (teamId) => {
    setCheckedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Navegación en previsualización
  const handleNextPreview = () => {
    if (pdfPreviews.length === 0) return;
    setCurrentPreviewIndex((prev) => (prev + 1) % pdfPreviews.length);
  };
  const handlePrevPreview = () => {
    if (pdfPreviews.length === 0) return;
    setCurrentPreviewIndex((prev) => (prev - 1 + pdfPreviews.length) % pdfPreviews.length);
  };

  return (
    <Container>
      {/* Barra izquierda */}
      <LeftPanel>
        <Section>
          <Label>Plantilla PDF</Label>
          <HiddenInput
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handlePlantillaUpload}
          />
          <Button
            onClick={() => fileInputRef.current.click()}
            style={{ marginTop: '5px' }}
          >
            {plantillaPDF ? 'Plantilla cargada ✓' : 'Seleccionar archivo...'}
          </Button>
        </Section>

        <Section>
          <Label>Seleccionar Evento</Label>
          <Select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="">-- Selecciona un evento --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </Select>
        </Section>

        <Section>
          <Label>Equipos</Label>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th></th>
                  <th>Equipo</th>
                  <th># Integrantes</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!checkedTeams[t.id]}
                        onChange={() => toggleCheckTeam(t.id)}
                      />
                    </td>
                    <td>{t.nombre}</td>
                    <td>{t.integrantes?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </Section>

        <Section>
          <CheckboxRow>
            <input
              type="checkbox"
              disabled
              checked={sendByEmail}
              onChange={() => setSendByEmail(!sendByEmail)}
            />
            <span style={{ marginLeft: '8px' }}>Enviar por correo (desactivado)</span>
          </CheckboxRow>
        </Section>

        <Section>
          <Button onClick={handleGenerarConstancias}>
            Generar Constancias
          </Button>
        </Section>
      </LeftPanel>

      {/* Panel derecho: previsualización */}
      <RightPanel>
        <PreviewArea>
          {pdfPreviews.length > 0 ? (
            <iframe
              key={pdfPreviews[currentPreviewIndex]}
              src={pdfPreviews[currentPreviewIndex]}
              title="Vista previa PDF"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <Placeholder>Aquí se mostrará la constancia generada</Placeholder>
          )}
        </PreviewArea>
        <PreviewNav>
          <NavButton onClick={handlePrevPreview}>{'<'}</NavButton>
          <span>
            {pdfPreviews.length === 0 
              ? 'Sin previsualizaciones' 
              : `Constancia ${currentPreviewIndex + 1} / ${pdfPreviews.length}`
            }
          </span>
          <NavButton onClick={handleNextPreview}>{'>'}</NavButton>
        </PreviewNav>

      </RightPanel>
    </Container>
  );
}

// -----------------------------------------------------------
// Estilos con styled-components
// -----------------------------------------------------------
const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
`;

const LeftPanel = styled.div`
  width: 400px;
  min-width: 320px;
  background-color: ${({ theme }) => theme.bg2};
  padding: 20px;
  overflow-y: auto;
`;

const RightPanel = styled.div`
  flex: 1;
  background-color: ${({ theme }) => theme.bgtgderecha};
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const HiddenInput = styled.input`
  display: none;
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  background: ${({ theme }) => theme.bg || '#fff'};
  color: ${({ theme }) => theme.text || '#000'};
`;

const TableWrapper = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.border || '#ccc'};
  }

  thead tr {
    background-color: ${({ theme }) => theme.bg4 || '#ccc'};
    color: ${({ theme }) => theme.textsecondary || '#fff'};
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  font-size: 0.95rem;
`;

const PreviewNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NavButton = styled.button`
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  background-color: ${({ theme }) => theme.primary};
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

const PreviewArea = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  overflow: hidden;
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.bg3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.texttertiary};
  font-size: 0.9rem;
`;
