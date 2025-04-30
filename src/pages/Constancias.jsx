import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PDFDocument,  StandardFonts } from 'pdf-lib';
import { rgb, cmyk, grayscale } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { PDFName, PDFNumber } from 'pdf-lib';
// Reutilizamos tu instancia de Firebase
import { db } from '../firebaseConfig';

export function Constancias() {
  // 1) Estados generales
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [teams, setTeams] = useState([]);
  const [plantillaPDF, setPlantillaPDF] = useState(null);

  // 2) Checkboxes de equipos
  const [checkedTeams, setCheckedTeams] = useState({});

  // 3) Checkbox “Enviar por correo”
  const [sendByEmail, setSendByEmail] = useState(false);

  // 4) Previsualización
  const [pdfPreviews, setPdfPreviews] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // 5) Para mostrar overlay mientras se envían correos
  const [loadingEmail, setLoadingEmail] = useState(false);

  // 6) Referencia para subir la plantilla
  const fileInputRef = useRef(null);
  
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [progress, setProgress] = useState(0);

  // ------------------------------------------------------------------
  // Cargar eventos al inicio
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // Cuando cambia el evento seleccionado, cargar equipos + integrantes.
  // Luego generar constancias de forma automática si ya hay plantilla.
  // ------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    if (!selectedEvent) {
      setTeams([]);
      return;
    }
    const loadTeams = async () => {
      try {
        setTeams([]);
        setCheckedTeams({});
        setPdfPreviews([]);
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
        if (isMounted) {
          setTeams(allTeams);
          const initialChecks = {};
          allTeams.forEach(t => { initialChecks[t.id] = true; });
          setCheckedTeams(initialChecks);
        }
      } catch (error) {
        console.error('Error cargando equipos:', error);
      }
    };
    loadTeams();
    return () => {
      isMounted = false;
    };
  }, [selectedEvent]);

  // ------------------------------------------------------------------
  // Cargar la plantilla PDF
  // ------------------------------------------------------------------
  
  const handlePlantillaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Verificar que realmente sea PDF
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

  const generatePreviewsForSelectedTeams = async () => {
    // Get only teams that are explicitly checked (true)
    const selectedTeamsList = teams.filter(t => checkedTeams[t.id] === true);
    
    // Clear previous previews
    setPdfPreviews([]);
    setCurrentPreviewIndex(0);
    
    // If no teams selected, don't generate anything
    if (selectedTeamsList.length === 0) {
      alert('No hay equipos seleccionados');
      return;
    }
    
    setLoadingPreviews(true);
    setProgress(0);
    
    const previewBlobs = [];
    
    // Calculate total number of participants for progress tracking
    const totalParticipants = selectedTeamsList.reduce((total, team) => 
      total + team.integrantes.length, 0);
    
    let processedCount = 0;
    
    // Only generate for teams that are actually checked
    for (const team of selectedTeamsList) {
      // Generamos la constancia para cada integrante del equipo
      for (const integrante of team.integrantes) {
        const participante = { teamName: team.nombre, ...integrante };
        const pdfBytes = await generarPDFpara(participante, plantillaPDF, mensajePersonalizado);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        previewBlobs.push(url);
        
        // Update progress after each PDF is generated
        processedCount++;
        const currentProgress = Math.round((processedCount / totalParticipants) * 100);
        setProgress(currentProgress);
      }
    }
    
    // Only update state if we have previews
    if (previewBlobs.length > 0) {
      setPdfPreviews(previewBlobs);
      setCurrentPreviewIndex(0);
    }
    
    // Keep the "Constancias generadas" message visible for a moment
    setTimeout(() => {
      setLoadingPreviews(false);
    }, 1500);
  };
  const handlePreviewConstancias = () => {
    if (plantillaPDF) {
      generatePreviewsForSelectedTeams();
    } else {
      alert('Por favor sube una plantilla PDF primero');
    }
  };
  
  // Ensure useEffect triggers correctly on checkbox changes

  
  

  // ------------------------------------------------------------------
  // Generar TODAS las constancias => descarga ZIP + previsualización
  // + si “enviar por correo” está marcado, enviar correos también
  // ------------------------------------------------------------------
  const handleGenerarConstancias = async () => {
    if (!plantillaPDF) {
      alert('Por favor sube una plantilla PDF primero');
      return;
    }
  
    // Filtramos solo equipos marcados
    const selectedTeamsList = teams.filter(t => checkedTeams[t.id]);
  
    // Obtenemos todos los participantes
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
      const previewBlobs = [];
  
      // Generamos PDFs uno por uno
      for (let i = 0; i < allParticipants.length; i++) {
        const p = allParticipants[i];
        const pdfBytes = await generarPDFpara(p, plantillaPDF);
  
        // Guardar en ZIP
        const fileName = `Constancia_${p.teamName.replace(/\s/g, '_')}_${(p.nombre || '').replace(/\s/g, '_')}.pdf`;
        zip.file(fileName, pdfBytes);
  
        // Previsualización
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        previewBlobs.push(url);
      }
  
      // Actualizamos el listado de previsualizaciones
      setPdfPreviews(previewBlobs);
      setCurrentPreviewIndex(0);
  
      // Descargar ZIP final
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'constancias.zip');
  
      // Si “enviar por correo” está activo, enviamos
      if (sendByEmail) {
        await handleEnviarCorreos();
      }
    } catch (error) {
      console.error('Error generando constancias:', error);
      alert('Ocurrió un error durante la generación de constancias');
    }
  };

  // ------------------------------------------------------------------
  // Genera un PDF para un participante (código tal como en “pre”
  // ------------------------------------------------------------------
  const generarPDFpara = async (participante, pdfTemplate, mensajePersonalizado) => {
    if (!participante) throw new Error('No se proporcionó información del participante');
    if (!pdfTemplate) throw new Error('No se proporcionó la plantilla PDF');
  
    const { nombre = '', teamName = '' } = participante;
  
    if (!nombre.trim()) throw new Error('El nombre del participante es obligatorio');
    if (!teamName.trim()) throw new Error('El nombre del equipo es obligatorio');
  
    try {
      const pdfDoc = await PDFDocument.load(pdfTemplate);
      pdfDoc.registerFontkit(fontkit);
  
      const TAMANO_NOMBRE = 28;
      const TAMANO_EQUIPO = 22;
      const MENSAJE_FONT_SIZE = 16;
      const ESPACIADO_LINEA = 20;
  
      let customFont;
      try {
        const fontResponse = await fetch('/fonts/Patria_Regular.otf');
        if (!fontResponse.ok) throw new Error(`Error al cargar fuente: ${fontResponse.statusText}`);
        const fontBytes = await fontResponse.arrayBuffer();
        customFont = await pdfDoc.embedFont(fontBytes);
        console.log('Fuente personalizada cargada exitosamente');
      } catch (error) {
        console.warn('Usando fuente Helvetica por defecto:', error.message);
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
  
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
  
      // 1. Dibuja el nombre
      const nombreY = height / 2 + 40;
      const nombreWidth = customFont.widthOfTextAtSize(nombre.toUpperCase(), TAMANO_NOMBRE);
      page.drawText(nombre.toUpperCase(), {
        x: (width - nombreWidth) / 2,
        y: nombreY,
        font: customFont,
        size: TAMANO_NOMBRE,
        color: rgb(73 / 255, 73 / 255, 73 / 255),
      });
  
      // 2. Mensaje personalizado debajo del nombre
      let yDespuesDelMensaje = nombreY - 30;
      if (mensajePersonalizado && mensajePersonalizado.trim()) {
        const maxLineWidth = width * 0.8;
        const palabras = mensajePersonalizado.trim().split(/\s+/);
        const lineas = [];
        let lineaActual = "";
  
        for (let i = 0; i < palabras.length; i++) {
          const testLinea = lineaActual + (lineaActual ? " " : "") + palabras[i];
          const testWidth = customFont.widthOfTextAtSize(testLinea, MENSAJE_FONT_SIZE);
          if (testWidth < maxLineWidth) {
            lineaActual = testLinea;
          } else {
            lineas.push(lineaActual);
            lineaActual = palabras[i];
          }
        }
        if (lineaActual) lineas.push(lineaActual);
  
        const mensajeBaseY = nombreY - 30;
  
        lineas.forEach((linea, index) => {
          const lineWidth = customFont.widthOfTextAtSize(linea, MENSAJE_FONT_SIZE);
          page.drawText(linea, {
            x: (width - lineWidth) / 2,
            y: mensajeBaseY - index * ESPACIADO_LINEA,
            font: customFont,
            size: MENSAJE_FONT_SIZE,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
  
        yDespuesDelMensaje = mensajeBaseY - lineas.length * ESPACIADO_LINEA - 20;
      }
  
      // 3. Dibuja el equipo después del mensaje (o después del nombre si no hay mensaje)
      const equipoTexto = `Equipo: ${teamName}`;
      const equipoWidth = customFont.widthOfTextAtSize(equipoTexto, TAMANO_EQUIPO);
      page.drawText(equipoTexto, {
        x: (width - equipoWidth) / 2,
        y: yDespuesDelMensaje,
        font: customFont,
        size: TAMANO_EQUIPO,
        color: rgb(65 / 255, 65 / 255, 65 / 255),
      });
  
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (err) {
      console.error('Error detallado:', err);
      throw new Error(`Error al generar PDF para ${nombre}: ${err.message}`);
    }
  };
  
  
  

  // ------------------------------------------------------------------
  // Enviar constancias por correo (lógica intacta de “post”)
  // ------------------------------------------------------------------
  const handleEnviarCorreos = async () => {
    if (!plantillaPDF) {
      alert('Por favor sube una plantilla PDF primero');
      return;
    }

    // Tomamos equipos/participantes marcados
    const selectedTeamsList = teams.filter(t => checkedTeams[t.id]);
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
      alert('No hay integrantes seleccionados para enviar correo');
      return;
    }

    setLoadingEmail(true);
    try {
      for (let i = 0; i < allParticipants.length; i++) {
        const p = allParticipants[i];
        // Solo enviamos si tiene correo
        if (!p.correo) continue;
        const pdfBytes = await generarPDFpara(p, plantillaPDF);
        const base64Pdf = arrayBufferToBase64(pdfBytes);

        // Petición al servidor
        const response = await fetch('http://localhost:3000/enviarConstancia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correo: p.correo,
            nombre: p.nombre,
            equipo: p.teamName,
            pdf: base64Pdf
          })
        });
        if (!response.ok) {
          console.error(`Error enviando correo a ${p.correo}`);
        }
      }
      alert('Correos enviados correctamente');
    } catch (error) {
      console.error('Error al enviar correos:', error);
      alert('Error al enviar correos');
    } finally {
      setLoadingEmail(false);
    }
  };

  // ------------------------------------------------------------------
  // Función auxiliar para convertir ArrayBuffer a base64 (intacta)
  // ------------------------------------------------------------------
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // ------------------------------------------------------------------
  // Navegación de previsualización (sin cambios)
  // ------------------------------------------------------------------
  const handleNextPreview = () => {
    if (pdfPreviews.length === 0) return;
    setCurrentPreviewIndex((prev) => (prev + 1) % pdfPreviews.length);
  };

  const handlePrevPreview = () => {
    if (pdfPreviews.length === 0) return;
    setCurrentPreviewIndex((prev) => (prev - 1 + pdfPreviews.length) % pdfPreviews.length);
  };

  // ------------------------------------------------------------------
  // Toggle de selección de equipo
  // ------------------------------------------------------------------
  const toggleCheckTeam = (teamId) => {
    setCheckedTeams(prev => {
      const newCheckedTeams = {
        ...prev,
        [teamId]: !prev[teamId]
      };
      return newCheckedTeams;
    });
  };

  const [mensajePersonalizado, setMensajePersonalizado] = useState('');


  // ------------------------------------------------------------------
  // Render principal
  // ------------------------------------------------------------------
  return (
    
      <Container>
        {/* Panel Izquierdo */}
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
            <Label>Equipos  <Button onClick={handlePreviewConstancias} style={{ marginBottom: '10px' }}>
              Previsualizar Constancias
            </Button></Label>
            <TableWrapper>
           
            <Section>
            
            
          </Section>
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
  <Label>Mensaje personalizado</Label>
  <textarea
    value={mensajePersonalizado}
    onChange={(e) => setMensajePersonalizado(e.target.value)}
    placeholder="Escribe aquí el mensaje que aparecerá en cada constancia..."
    rows={4}
    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
  />
</Section>

    
          <Section>
            <CheckboxRow>
              <input
                type="checkbox"
                checked={sendByEmail}
                onChange={() => setSendByEmail(!sendByEmail)}
              />
              <span style={{ marginLeft: '8px' }}>Enviar por correo</span>
            </CheckboxRow>
          </Section>
          
    
          <Section>
            <Button onClick={handleGenerarConstancias}>
              Generar Constancias
            </Button>
            
          </Section>
        </LeftPanel>
    
        {/* Panel Derecho: Previsualización */}
        <RightPanel>
          
          <PreviewArea>
            {pdfPreviews.length > 0 ? (
              <iframe
                key={pdfPreviews[currentPreviewIndex]}
                src={pdfPreviews[currentPreviewIndex]}
                title="Vista prevía PDF"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <Placeholder>
                Aquí se mostrará la constancia generada
              </Placeholder>
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
    
        {/* Overlay de carga al enviar correos */}
        {loadingEmail && (
          <LoadingOverlay>
            <LoadingMessage>
              Enviando constancias, por favor espere...
            </LoadingMessage>
          </LoadingOverlay>
        )}
        {loadingPreviews && (
  <LoadingOverlay>
    <LoadingMessage style={{ width: '50vh', height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <ProgressCircle>
        {progress}%
      </ProgressCircle>
      <div style={{ marginTop: '20px'}}>
        {progress === 100 ? "Constancias generadas" : "Generando constancias..."}
      </div>
    </LoadingMessage>
  </LoadingOverlay>
)}
        
      </Container>
    );
}

// ------------------------------------------------------------------
// Estilos con styled-components (sin cambios relevantes)
// ------------------------------------------------------------------
const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
`;
const ProgressContainer = styled.div`
  margin-top: 10px;
  text-align: center;
`;


const ProgressCircle = styled.div`
  width: 10vh;
  height: 10vh;
  border-radius: 50%;
  border: 5px solid ${({ theme }) => theme.primary};
  border-top: 5px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-weight: bold;
  color: ${({ theme }) => theme.primary};
  position: relative;
  animation: spin 1.5s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  &::after {

    position: absolute;
    animation: spinReverse 1.5s linear infinite;
    
    @keyframes spinReverse {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-360deg); }
    }
  }
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
  width: 100%;
  display: block;
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

const PreviewArea = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NavButton = styled.button`
  min-width: 40px;
  height: 40px;
  font-size: 1.2rem;
  background-color: ${({ theme }) => theme.primary};
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    opacity: 0.8;
  }
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

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingMessage = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
`;