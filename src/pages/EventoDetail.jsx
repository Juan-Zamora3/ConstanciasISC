// src/pages/EventoDetail.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ajusta según tu export

export function EventoDetail() {
  const { id } = useParams();       // ID del evento en la URL => /evento/:id
  const navigate = useNavigate();   // Para navegar/volver

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del evento al montar el componente
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

  if (loading) {
    return <p>Cargando evento...</p>;
  }

  if (!evento) {
    return <p>No se encontró el evento con ID: {id}</p>;
  }

  // Función para regresar a la página anterior
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container>
      {/* Header con botón de volver */}
      <Header>
        <BackButton onClick={handleGoBack}>Volver</BackButton>
        <h2>{evento.nombre}</h2>
      </Header>

      <DetailsContainer>
        <p><strong>Nombre:</strong> {evento.nombre}</p>
        <p><strong>Descripción:</strong> {evento.descripcion}</p>
        <p><strong>Fecha de Creación:</strong> {evento.fecha}</p>
      </DetailsContainer>

      {evento.participantes && evento.participantes.length > 0 && (
        <>
          <h3>Participantes</h3>
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
                {evento.participantes.map((p, i) => (
                  <tr key={i}>
                    <td>{p.equipo}</td>
                    <td>{p.alumnos}</td>
                    <td>{p.numControl}</td>
                    <td>{p.carrera}</td>
                    <td>{p.semestre}</td>
                    <td>{p.correo}</td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          </TablaContainer>
        </>
      )}
    </Container>
  );
}

// --------------------------------------------
// Estilos con styled-components
// --------------------------------------------
const Container = styled.div`
  padding: 20px 30px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.textprimary};
  height: 100vh;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const BackButton = styled.button`
  background: ${({ theme }) => theme.bg4};
  color: ${({ theme }) => theme.textsecondary};
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
`;

const DetailsContainer = styled.div`
  p {
    margin: 0.5rem 0;
  }
`;

const TablaContainer = styled.div`
  margin-top: 1rem;
  border: 1px solid ${({ theme }) => theme.border || '#ccc'};
  border-radius: 8px;
  overflow: auto;
  max-height: 300px;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.border || '#ccc'};
    font-size: ${({ theme }) => theme.fontsm};
  }
  th {
    background: ${({ theme }) => theme.bg4};
    color: ${({ theme }) => theme.textsecondary};
  }
`;
