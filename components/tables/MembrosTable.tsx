// Exemplo de componente de tabela para Membros
import React from 'react';

export default function MembrosTable() {
  // Dados de exemplo
  const membros = [
    { id: 1, nome: 'João', funcao: 'Líder' },
    { id: 2, nome: 'Maria', funcao: 'Professor' },
  ];

  return (
    <table className="min-w-full border">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Função</th>
        </tr>
      </thead>
      <tbody>
        {membros.map((m) => (
          <tr key={m.id}>
            <td>{m.nome}</td>
            <td>{m.funcao}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
