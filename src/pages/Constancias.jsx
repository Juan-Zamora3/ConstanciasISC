import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export function Constancias() {
  const [constancias, setConstancias] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [plantilla, setPlantilla] = useState(null);
  const [categoria, setCategoria] = useState('');

  // Datos iniciales
  useEffect(() => {
    const initialTeams = [
      { 
        nombre: "Equipo Alpha", 
        integrantes: ["ANA PÉREZ", "CARLOS RUIZ"], 
        categoria: "HACKATEC LOCAL 2025" 
      },
      { 
        nombre: "Equipo Beta", 
        integrantes: ["LUIS MARTÍNEZ"], 
        categoria: "ESTRUCTURAS COMPLEJAS 2025" 
      }
    ];
    
    setTeams(initialTeams);
  }, []);

  const cargarPlantilla = async (categoria) => {
    try {
      const templateMap = {
        'HACKATEC LOCAL 2025': '/plantillas/onstancia_hackatec_2025.pdf',
        'ESTRUCTURAS COMPLEJAS 2025': '/plantillas/constancia_estructuras_2025.pdf'
      };
      
      const response = await fetch(templateMap[categoria]);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const pdfBytes = await response.arrayBuffer();

      const header = new Uint8Array(pdfBytes.slice(0, 5));
      if (String.fromCharCode(...header) !== '%PDF-') {
        throw new Error('Archivo no es un PDF válido');
      }
      
      setPlantilla(pdfBytes);
      
    } catch (error) {
      console.error('Error cargando plantilla:', error);
      alert(`Error cargando plantilla: ${error.message}`);
    }
  };

  const generarConstancia = async (nombre, equipo, categoria) => {
    try {
      // Validar parámetros de entrada
      if (!nombre || !equipo || !categoria) {
        throw new Error('Faltan parámetros requeridos para generar la constancia');
      }
  
      // Verificar plantilla cargada
      if (!plantilla) {
        throw new Error('No se ha cargado ninguna plantilla PDF');
      }
  
      // Cargar documento PDF
      const pdfDoc = await PDFDocument.load(plantilla);
      pdfDoc.registerFontkit(fontkit);
  
      // Cargar fuente personalizada
      let font;
      try {
        const fontResponse = await fetch('/fonts/GolosText-VariableFont_wght.ttf');
        if (!fontResponse.ok) throw new Error(`Error ${fontResponse.status} cargando fuente`);
        const fontBytes = await fontResponse.arrayBuffer();
        font = await pdfDoc.embedFont(fontBytes);
      } catch (fontError) {
        console.warn('Usando fuente estándar debido a error en fuente personalizada:', fontError);
        font = await pdfDoc.embedFont(PDFDocument.StandardFonts.Helvetica);
      }
  
      // Obtener primera página
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
  
      // Configurar coordenadas (ajustar según tu plantilla)
      const coordenadas = {
        nombre: { x: 105, y: 135, size: 14 },
        equipo: { x: 105, y: 165, size: 12 },
        categoria: { x: 105, y: 185, size: 12 }
      };
  
      // Función para dibujar texto con validación
      const dibujarTexto = (texto, config) => {
        if (!texto || typeof texto !== 'string') {
          console.warn('Texto inválido para dibujar:', texto);
          return;
        }
  
        firstPage.drawText(texto.toUpperCase(), {
          x: config.x,
          y: config.y,
          size: config.size,
          font,
          color: rgb(0, 0, 0),
          align: 'center'
        });
      };
  
      // Insertar datos en el PDF
      dibujarTexto(nombre, coordenadas.nombre);
      dibujarTexto(equipo, coordenadas.equipo);
      dibujarTexto(categoria, coordenadas.categoria);
  
      // Generar PDF modificado
      const pdfBytes = await pdfDoc.save();
      
      // Validar PDF resultante
      if (!pdfBytes || pdfBytes.length < 1024) {
        throw new Error('El PDF generado está vacío o corrupto');
      }
  
      return new Blob([pdfBytes], { 
        type: 'application/pdf',
        endings: 'transparent'
      });
  
    } catch (error) {
      console.error('Error crítico al generar constancia:', error);
      throw new Error(`No se pudo generar la constancia: ${error.message}`);
    }
  };

  const handleGenerar = async () => {
    try {
      if (!selectedTeam || !categoria) return;
  
      await cargarPlantilla(categoria);
      if (!plantilla) throw new Error('No hay plantilla cargada');
      
      const team = teams.find(t => t.nombre === selectedTeam);
      
      for (const integrante of team.integrantes) {
        const pdfBlob = await generarConstancia(integrante, team.nombre, categoria);
        
        // Verificar blob antes de crear URL
        if (!(pdfBlob instanceof Blob)) {
          throw new Error('El PDF generado no es válido');
        }
        
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `CONSTANCIA_${integrante.replace(/ /g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Liberar memoria
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      }
  
      setConstancias([...constancias, {
        id: Date.now(),
        equipo: selectedTeam,
        integrantes: team.integrantes,
        categoria,
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }]);
  
    } catch (error) {
      console.error('Error generando constancias:', error);
      alert(`Error al generar: ${error.message}`);
    }
  };
    // Registrar en el historial


  return (
    <Container>
      <Header>
        <h1>Generador de Constancias</h1>
      </Header>

      <FormContainer>
        <FormGroup>
          <label>Seleccionar Equipo</label>
          <Select 
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Selecciona un equipo</option>
            {teams.map((team, index) => (
              <option key={index} value={team.nombre}>{team.nombre}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <label>Seleccionar Categoría</label>
          <Select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Selecciona categoría</option>
            <option value="HACKATEC LOCAL 2025">HACKATEC Local</option>
            <option value="ESTRUCTURAS COMPLEJAS 2025">Estructuras Complejas</option>
          </Select>
        </FormGroup>

        <ActionButton onClick={handleGenerar} disabled={!selectedTeam || !categoria}>
          Generar Constancias
        </ActionButton>
      </FormContainer>

      <HistorySection>
        <h2>Historial de Generación</h2>
        <Table>
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Integrantes</th>
            </tr>
          </thead>
          <tbody>
            {constancias.map((constancia) => (
              <tr key={constancia.id}>
                <td>{constancia.equipo}</td>
                <td>{constancia.categoria}</td>
                <td>{constancia.fecha}</td>
                <td>{constancia.integrantes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </HistorySection>
    </Container>
  );
}

// Estilos
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

const Select = styled.select`
  /* Estilos heredados de FormGroup */
`;

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