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
import { doc, getDoc, setDoc } from 'firebase/firestore';


export function Constancias() {
  // 1) Estados generales
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [teams, setTeams] = useState([]);
  const [plantillaPDF, setPlantillaPDF] = useState(null);

  // 2) Checkboxes de equipos
  const [checkedTeams, setCheckedTeams] = useState({});
  // Para coordinadores: cuál está seleccionado (radio)
const [selectedCoordId, setSelectedCoordId] = useState(null);
// Mensaje personalizado para coordinadores
const [mensajePersonalizado, setMensajePersonalizado] = useState('');


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

  // 1) Previsualización
const generatePreviewsForSelectedTeams = async () => {
  // 1.1) Elegir lista según tipo
  let selectedItems = [];
  if (tipoConstancia === 'coordinadores') {
    if (!selectedCoordId) {
      alert('Selecciona un coordinador primero');
      return;
    }
    selectedItems = teams.filter(t => t.id === selectedCoordId);
  } else {
    selectedItems = teams.filter(t => checkedTeams[t.id] === true);
  }

  // 1.2) Limpiar previas
  setPdfPreviews([]);
  setCurrentPreviewIndex(0);

  if (selectedItems.length === 0) {
    alert(
      tipoConstancia === 'coordinadores'
        ? 'No hay coordinador seleccionado'
        : 'No hay equipos seleccionados'
    );
    return;
  }

  setLoadingPreviews(true);
  setProgress(0);

  const previewBlobs = [];
  // contar participantes para el progreso
  const total = selectedItems.reduce((sum, t) => sum + (t.integrantes?.length || 0), 0);
  let count = 0;

  // 1.3) Generar uno a uno
  for (const team of selectedItems) {
    for (const integrante of team.integrantes) {
      const participante = { teamName: team.nombre, ...integrante };
      const pdfBytes = await generarPDFpara(participante, plantillaPDF, mensajePersonalizado);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      previewBlobs.push(URL.createObjectURL(blob));

      count++;
      setProgress(Math.round((count / total) * 100));
    }
  }

  if (previewBlobs.length > 0) {
    setPdfPreviews(previewBlobs);
    setCurrentPreviewIndex(0);
  }

  // dejar un momento el mensaje de 100%
  setTimeout(() => setLoadingPreviews(false), 1500);
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
 // 2) Generar ZIP y descarga
const handleGenerarConstancias = async () => {
  if (!plantillaPDF) {
    alert('Por favor sube una plantilla PDF primero');
    return;
  }

  // 2.1) Construir lista de participantes según tipo
  let allParticipants = [];
  if (tipoConstancia === 'coordinadores') {
    if (!selectedCoordId) {
      alert('Selecciona un coordinador primero');
      return;
    }
    const equipo = teams.find(t => t.id === selectedCoordId);
    equipo.integrantes.forEach(i => allParticipants.push({ teamName: equipo.nombre, ...i }));
  } else {
    teams
      .filter(t => checkedTeams[t.id])
      .forEach(t =>
        t.integrantes.forEach(i =>
          allParticipants.push({ teamName: t.nombre, ...i })
        )
      );
  }

  if (allParticipants.length === 0) {
    alert('No hay integrantes seleccionados');
    return;
  }

  try {
    const zip = new JSZip();
    const previewBlobs = [];

    for (const p of allParticipants) {
      const pdfBytes = await generarPDFpara(p, plantillaPDF, mensajePersonalizado);
      const name = `Constancia_${p.teamName.replace(/\s/g, '_')}_${(p.nombre||'').replace(/\s/g, '_')}.pdf`;
      zip.file(name, pdfBytes);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      previewBlobs.push(URL.createObjectURL(blob));
    }

    // mostrar previsualizaciones
    setPdfPreviews(previewBlobs);
    setCurrentPreviewIndex(0);

    // descargar ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'constancias.zip');

    if (sendByEmail) await handleEnviarCorreos();
  } catch (err) {
    console.error('Error generando constancias:', err);
    alert('Ocurrió un error durante la generación de constancias');
  }
};


  // ------------------------------------------------------------------
  // Genera un PDF para un participante (código tal como en “pre”
  // ------------------------------------------------------------------
  const generarPDFpara = async (participante, pdfTemplate, mensajePersonalizado) => {
    // 0) Validaciones previas
    if (!participante) throw new Error('No se proporcionó información del participante');
    if (!pdfTemplate) throw new Error('No se proporcionó la plantilla PDF');
    const { nombre = '' } = participante;
    if (!nombre.trim()) throw new Error('El nombre del participante es obligatorio');
  
    try {
      // 1) Cargo la plantilla y registro fontkit
      const pdfDoc = await PDFDocument.load(pdfTemplate);
      pdfDoc.registerFontkit(fontkit);
  
      // 2) Cargo y embebo Arial Regular y Bold (nombres CASE SENSITIVE)
      const [regResp, boldResp] = await Promise.all([
        fetch('/fonts/Patria_Regular.otf'),
        fetch('/fonts/Patria_Regular.otf'),
      ]);
      if (!regResp.ok)  throw new Error('No se encontró /fonts/Patria_Regular.otf');
      if (!boldResp.ok) throw new Error('No se encontró /fonts/Patria_Regular.otf');
      const [regBytes, boldBytes] = await Promise.all([
        regResp.arrayBuffer(),
        boldResp.arrayBuffer(),
      ]);
      const fontReg  = await pdfDoc.embedFont(regBytes);
      const fontBold = await pdfDoc.embedFont(boldBytes);
  
      // 3) Parámetros de dibujo
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      const SIZE_NAME      = 28;
      const SIZE_TEXT      = 14;
      const LINE_HEIGHT    = 20;
      const MARGIN_H       = 50;
      const COLOR_NAME     = rgb(73/255, 73/255, 73/255);
      const COLOR_TEXT     = rgb(0.2, 0.2, 0.2);
  
      // 4) Dibujo el nombre (centrado)
      const nameTXT = nombre.toUpperCase();
      const nameW   = fontBold.widthOfTextAtSize(nameTXT, SIZE_NAME);
      const nameY   = height / 2 + 50;
      page.drawText(nameTXT, {
        x:    (width - nameW) / 2.5,
        y:    nameY,
        font: fontBold,
        size: SIZE_NAME,
        color: COLOR_NAME,
      });
  
      // 5) Dibujo el párrafo con word-wrapping (centrado)
      const text = mensajePersonalizado.trim();
      const maxW = width - 2 * MARGIN_H;
      // rompo en líneas
      const palabras = text.split(/\s+/);
      const lineas = [];
      let linea = '';
      for (const palabra of palabras) {
        const prueba = linea ? `${linea} ${palabra}` : palabra;
        if (fontReg.widthOfTextAtSize(prueba, SIZE_TEXT) <= maxW) {
          linea = prueba;
        } else {
          lineas.push(linea);
          linea = palabra;
        }
      }
      if (linea) lineas.push(linea);
  
      // empiezo justo debajo del nombre
      let cursorY = nameY - SIZE_NAME -5;
      for (const l of lineas) {
        const w = fontReg.widthOfTextAtSize(l, SIZE_TEXT);
        page.drawText(l, {
          x:     (width - w) / 2.5,
          y:     cursorY,
          font:  fontReg,
          size:  SIZE_TEXT,
          color: COLOR_TEXT,
        });
        cursorY -= LINE_HEIGHT;
      }
  
      // 6) Devuelvo el PDF modificado
      return await pdfDoc.save();
    } catch (err) {
      console.error('Error generando PDF:', err);
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

  const handleMensajeChange = (e) => {
    setMensajePersonalizado(e.target.value);
  };

  // al inicio del componente
  const [tipoConstancia, setTipoConstancia] = useState('equipos');

  useEffect(() => {
    if (!selectedEvent) {
      setTeams([]);
      return;
    }
  
    const loadData = async () => {
      try {
        let data = [];
  
        // 1) Equipos de estudiantes
        if (tipoConstancia === 'equipos') {
          const q = query(
            collection(db, 'equipos'),
            where('eventoId', '==', selectedEvent)
          );
          const snap = await getDocs(q);
          data = await Promise.all(
            snap.docs.map(async d => {
              const team = { id: d.id, ...d.data() };
              const qI = query(
                collection(db, 'integrantes'),
                where('equipoId', '==', d.id)
              );
              const snapI = await getDocs(qI);
              team.integrantes = snapI.docs.map(i => ({ id: i.id, ...i.data() }));
              return team;
            })
          );
        }
  
        // 2) Coordinadores (agrupados por c.tipo)
        else if (tipoConstancia === 'coordinadores') {
          const q = query(
            collection(db, 'coordinadores'),
            where('eventoId', '==', selectedEvent)
          );
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Agrupar por campo `tipo`
          const grouped = docs.reduce((acc, c) => {
            acc[c.tipo] = acc[c.tipo] || [];
            acc[c.tipo].push(c);
            return acc;
          }, {});
          // Construir array para la UI
          data = Object.entries(grouped).map(([tipo, integrantes]) => ({
            id: tipo,       // usamos el tipo como id
            nombre: tipo,   // mostramos la categoría
            integrantes     // array de coordinadores de esa categoría
          }));
        }
  
        // 3) Maestros
        else if (tipoConstancia === 'maestros') {
          const q = query(
            collection(db, 'maestros'),
            where('eventoId', '==', selectedEvent)
          );
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          data = docs.map(m => ({
            id: m.id,
            nombre: m.nombre,
            integrantes: [m]
          }));
        }
  
        // Actualizar estado y checks
        setTeams(data);
        setCheckedTeams(
          data.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
        );
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
  
    loadData();
  }, [selectedEvent, tipoConstancia]);
  



// justo después de tus otros useEffects:
useEffect(() => {
  if (!selectedEvent) {
    setMensajePersonalizado('');
    return;
  }
  // Define el docId según el tipo
  let docId;
  if (tipoConstancia === 'coordinadores') {
    if (!selectedCoordId) {
      setMensajePersonalizado('');
      return;
    }
    docId = `coordinadores__${selectedCoordId}`;
  } else {
    docId = tipoConstancia; // 'equipos' o 'maestros'
  }

  let mounted = true;
  const loadMensaje = async () => {
    try {
      const ref = doc(
        db,
        'eventos',
        selectedEvent,
        'configConstancias',
        docId
      );
      const snap = await getDoc(ref);
      if (!mounted) return;
      if (snap.exists()) {
        setMensajePersonalizado(snap.data().texto || '');
      } else {
        await setDoc(ref, { texto: '' });
        setMensajePersonalizado('');
      }
    } catch (err) {
      console.error('Error cargando mensaje personalizado:', err);
      if (mounted) setMensajePersonalizado('');
    }
  };
  loadMensaje();
  return () => {
    mounted = false;
  };
}, [selectedEvent, tipoConstancia, selectedCoordId]);



// Cuando cambias de coordinador, carga su mensaje
useEffect(() => {
  if (!selectedEvent || tipoConstancia !== 'coordinadores' || !selectedCoordId) {
    setMensajePersonalizado('');
    return;
  }
  const load = async () => {
    const ref = doc(
      db,
      'eventos',
      selectedEvent,
      'configConstancias',
      `coordinadores__${selectedCoordId}`
    );
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setMensajePersonalizado(snap.data().texto || '');
    } else {
      // crea el doc vacío para la primera vez
      await setDoc(ref, { texto: '' });
      setMensajePersonalizado('');
    }
  };
  load();
}, [selectedEvent, tipoConstancia, selectedCoordId]);


// Y para guardar:
const handleMensajeBlur = async () => {
  if (!selectedEvent) return;

  // Decidir docId según el tipo
  let docId;
  if (tipoConstancia === 'coordinadores') {
    if (!selectedCoordId) return;
    docId = `coordinadores__${selectedCoordId}`;
  } else {
    docId = tipoConstancia; // 'equipos' o 'maestros'
  }

  try {
    const ref = doc(
      db,
      'eventos',
      selectedEvent,
      'configConstancias',
      docId
    );
    await setDoc(ref, { texto: mensajePersonalizado }, { merge: true });
  } catch (err) {
    console.error('Error guardando mensaje personalizado:', err);
  }
};










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
  <Label>Tipo de constancia</Label>
  <Select
    value={tipoConstancia}
    onChange={e => setTipoConstancia(e.target.value)}
  >
    <option value="equipos">Equipos de estudiantes</option>
    <option value="coordinadores">Coordinadores</option>
    <option value="maestros">Maestros</option>
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
                      {tipoConstancia === 'coordinadores' ? (
    <input
      type="radio"
      name="seleccionCoordinador"
      checked={selectedCoordId === t.id}
      onChange={() => setSelectedCoordId(t.id)}
    />
  ) : (
    <input
      type="checkbox"
      checked={!!checkedTeams[t.id]}
      onChange={() => toggleCheckTeam(t.id)}
    />
  )}
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
      onChange={e => setMensajePersonalizado(e.target.value)}
      onBlur={handleMensajeBlur}
      placeholder="Escribe aquí el mensaje que aparecerá en cada constancia..."
      rows={4}
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #ccc'
      }}
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