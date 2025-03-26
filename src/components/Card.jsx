
// Card.jsx
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

export const Card = ({ id, title, date, description, onClick, onDelete }) => {

    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) onClick(); // Llamar a la función si está definida
    };

    return (
        <StyledWrapper onClick={handleClick}>

            <div className="card">
            <DeleteButton onClick={(e) => { 
                  e.stopPropagation(); // Evita que el click en el botón dispare el onClick del card
                  onDelete(id); 
                  }}>
                    ×
                </DeleteButton>
                <h3 className="card__title">{title}</h3>

                <p className="card__content">{description}</p>
                <div className="card__date">{date}</div>
                <div className="card__arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height={15} width={15}>
                        <path fill="#fff" d="M13.4697 17.9697C13.1768 18.2626 13.1768 18.7374 13.4697 19.0303C13.7626 19.3232 14.2374 19.3232 14.5303 19.0303L20.3232 13.2374C21.0066 12.554 21.0066 11.446 20.3232 10.7626L14.5303 4.96967C14.2374 4.67678 13.7626 4.67678 13.4697 4.96967C13.1768 5.26256 13.1768 5.73744 13.4697 6.03033L18.6893 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H18.6893L13.4697 17.9697Z" />
                    </svg>
                </div>
            </div>
        </StyledWrapper>
    );
}

const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 10px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text}; /* Color del texto según el theme */
  font-size: 25px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color:rgb(170, 42, 72) /* Color de hover según el theme */
  }
`;


const StyledWrapper = styled.div`
  .card {
    --border-radius: 0.75rem;
    --primary-color: ${({ theme }) => theme.primary};
    --secondary-color: ${({ theme }) => theme.textSecondary};
    
    width: 210px;
    font-family: "Arial";
    padding: 1rem;
    cursor: pointer;
    border-radius: var(--border-radius);
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    position: relative;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
    }
  }

  .card > * + * {
    margin-top: 1.1em;
  }

  .card .card__content {
    color: var(--secondary-color);
    font-size: 0.86rem;
  }

  .card .card__title {
    padding: 0;
    font-size: 1.3rem;
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .card .card__date {
    color: ${({ theme }) => theme.textSecondary};
    font-size: 0.8rem;
  }

  .card .card__arrow {
    position: absolute;
    background: var(--primary-color);
    padding: 0.4rem;
    border-top-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    bottom: 0;
    right: 0;
    transition: all 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .card svg {
    transition: transform 0.2s ease;
  }

  /* hover effects */
  .card:hover .card__title {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .card:hover .card__arrow {
    background: ${({ theme }) => theme.primaryHover};
  }

  .card:hover .card__arrow svg {
    transform: translateX(3px);
  }
`;

export default Card;