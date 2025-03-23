import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  background-color: ${({ theme }) => theme.bgSecondary};
  border-bottom: 2px solid ${({ theme }) => theme.border};
`;

export const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${({ theme }) => theme.bgPrimary};
  }
  &:hover {
    background-color: ${({ theme }) => theme.bgHover};
  }
`;

export const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

export const ActionButton = styled.button`
  padding: 6px 12px;
  margin: 0 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${({ theme, variant }) => 
    variant === 'danger' ? theme.error : 
    variant === 'success' ? theme.success : 
    theme.primary};
  color: white;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;