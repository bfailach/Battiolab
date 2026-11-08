import React, { useState } from 'react';
import { Box, Button, Chip, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

/** Editor simple de listas de texto (departamentos, cargos, métodos de pago…). */
const ListEditor: React.FC<{
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}> = ({ values, onChange, placeholder, disabled }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        {values.map((v) => (
          <Chip key={v} label={v} onDelete={disabled ? undefined : () => onChange(values.filter((x) => x !== v))} />
        ))}
      </Box>
      {!disabled && (
        <Box sx={{ display: 'flex', gap: 1, maxWidth: 420 }}>
          <TextField
            value={draft}
            placeholder={placeholder}
            inputProps={{ 'aria-label': placeholder }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button variant="outlined" startIcon={<AddIcon />} onClick={add} sx={{ flexShrink: 0 }}>
            Agregar
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ListEditor;
