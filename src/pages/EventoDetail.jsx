// src/pages/EventoDetail.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
// Importamos db de tu firebaseConfig
import { db } from '../firebaseConfig';

// Importar subcomponentes (puedes ponerlos en archivos separados si gustas)
import { EquiposSection } from './EquiposSection';
import { MaestrosSection } from './MaestrosSection';
import { CoordinadoresSection } from './CoordinadoresSection';

export function EventoDetail() {
  const { id } = useParams();        // ID del evento => /evento/:id
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipos'); 
  // "equipos" o "integrantes"

  // Cargar la info del evento
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const docRef = doc(db, 'eventos', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setEvento({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error('Error al obtener el evento:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
  }, [id]);

  if (loading) return <Container>Cargando Evento...</Container>;
  if (!evento) return <Container>No se encontró el evento con ID: {id}</Container>;

  // Función para volver (similar a la "X" de los modales)
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container>
      {/* Header con botón "X" a la izquierda y botones a la derecha */}
      <Header>
        <LeftButtons>
          <CloseButton onClick={handleGoBack}>×</CloseButton>
          <Title>{evento.nombre}</Title>
        </LeftButtons>
        <RightButtons>
          <NavButton 
            isActive={activeTab === 'equipos'} 
            onClick={() => setActiveTab('equipos')}
          >
            Equipos
          </NavButton>
          <NavButton
            isActive={activeTab === 'Maestros'}
            onClick={() => setActiveTab('Maestros')}
          >
            Maestros
          </NavButton>
          <NavButton
            isActive={activeTab === 'Coordinadores'}
            onClick={() => setActiveTab('Coordinadores')}
          >
            Coordinadores
          </NavButton>
        </RightButtons>
      </Header>

      {/* Descripción y fecha del evento (opcional) */}
      <EventInfo>
        <p><strong>Descripción:</strong> {evento.descripcion}</p>
        <p><strong>Fecha de Creación:</strong> {evento.fecha}</p>
      </EventInfo>

      {/* Contenido principal */}
      {activeTab === 'equipos' && (
        <EquiposSection eventoId={evento.id} /> 
      )}
      {activeTab === 'Maestros' && (
        <MaestrosSection eventoId={evento.id} />
      )}
      {activeTab === 'Coordinadores' && (
        <CoordinadoresSection eventoId={evento.id} />
      )}
    </Container>
  );
}

// -------------------- Estilos --------------------
const Container = styled.div`
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.textprimary};
  height: 100vh;
  overflow-y: auto;
  padding: 20px 30px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const LeftButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CloseButton = styled.button`
  font-size: 35px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text|| '#999'};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontlg || '1.5rem'};
`;

const RightButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const NavButton = styled.button`
  background: ${({ isActive, theme }) => 
    isActive ? theme.primary : theme.bg2 || '#ccc'
  };
  color: ${({ isActive, theme }) => 
    isActive ? '#fff' : theme.textprimary
  };
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
`;

const EventInfo = styled.div`
  margin-bottom: 1.5rem;
  p {
    margin: 0.3rem 0;
  }
`;
