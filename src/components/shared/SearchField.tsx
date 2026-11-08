import React from 'react';
import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; maxWidth?: number }> = ({
  value,
  onChange,
  placeholder,
  maxWidth = 360
}) => (
  <TextField
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    inputProps={{ 'aria-label': placeholder }}
    sx={{ maxWidth }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon fontSize="small" />
        </InputAdornment>
      )
    }}
  />
);

export default SearchField;
