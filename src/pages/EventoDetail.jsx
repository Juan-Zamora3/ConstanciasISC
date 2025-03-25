import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';

export const DetalleEvento = () => {
  const { id } = useParams();
  const { state } = useLocation();

  return (
    <Container>
      <h1>{state?.title || 'Evento no encontrado'}</h1>
      <p className="fecha">{state?.date}</p>
      <p className="descripcion">{state?.description}</p>
      
      <h2>Participantes</h2>
      {state?.participantes ? (
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
            {state.participantes.map((participante, index) => (
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
      ) : (
        <p>No hay participantes registrados</p>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  th {
    background-color: ${({ theme }) => theme.bgSecondary};
  }
`;