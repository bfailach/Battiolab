import React, { useRef, useState } from 'react';
import { Box, Button, CircularProgress, IconButton, InputAdornment, MenuItem, TextField, TextFieldProps, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  cleanDocument,
  cleanPhone,
  cleanSku,
  DOCUMENT_TYPES,
  DocumentType,
  formatPhone,
  nitCheckDigit
} from '../../utils/validation';
import { assetUrl } from '../../api/http';
import { brand } from '../../theme';

type BaseProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'>;

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Campo numérico entero. Vacío muestra el placeholder ("0") en lugar de un 0 escrito,
 * y con `money` agrupa miles mientras se escribe (1.250.000).
 */
export const NumberField: React.FC<
  BaseProps & { value: number | null; onValueChange: (v: number | null) => void; money?: boolean; suffix?: string; max?: number }
> = ({ value, onValueChange, money, suffix, max, placeholder = '0', InputProps, inputProps, InputLabelProps, ...rest }) => {
  const display = value === null || value === undefined || Number.isNaN(value) ? '' : money ? group(String(value)) : String(value);
  return (
    <TextField
      {...rest}
      value={display}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        if (!digits) return onValueChange(null);
        const n = Number(digits);
        onValueChange(max !== undefined ? Math.min(n, max) : n);
      }}
      inputProps={{ inputMode: 'numeric', ...inputProps }}
      // La etiqueta queda arriba para que el "0" de ejemplo se vea siempre
      InputLabelProps={{ shrink: true, ...InputLabelProps }}
      InputProps={{
        ...(money ? { startAdornment: <InputAdornment position="start">$</InputAdornment> } : {}),
        ...(suffix ? { endAdornment: <InputAdornment position="end">{suffix}</InputAdornment> } : {}),
        ...InputProps
      }}
    />
  );
};

/** Teléfono colombiano de 10 dígitos, mostrado como 300 123 4567. */
export const PhoneField: React.FC<BaseProps & { value: string; onValueChange: (digits: string) => void }> = ({ value, onValueChange, ...rest }) => (
  <TextField
    label="Teléfono"
    placeholder="300 123 4567"
    {...rest}
    value={value.length === 10 ? formatPhone(value) : value}
    onChange={(e) => onValueChange(cleanPhone(e.target.value))}
    inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
  />
);

/** Tipo + número de documento. Para NIT calcula y muestra el dígito de verificación. */
export const DocumentFields: React.FC<{
  type: DocumentType;
  value: string;
  onTypeChange: (t: DocumentType) => void;
  onValueChange: (v: string) => void;
  error?: string | null;
  types?: DocumentType[];
  disabled?: boolean;
}> = ({ type, value, onTypeChange, onValueChange, error, types = Object.keys(DOCUMENT_TYPES) as DocumentType[], disabled }) => {
  const def = DOCUMENT_TYPES[type];
  const dv = type === 'NIT' && value.length === 9 ? nitCheckDigit(value) : null;
  return (
    <>
      <TextField
        select
        label="Tipo de documento"
        value={type}
        disabled={disabled}
        onChange={(e) => {
          const t = e.target.value as DocumentType;
          onTypeChange(t);
          onValueChange(cleanDocument(t, value).slice(0, DOCUMENT_TYPES[t].max));
        }}
      >
        {types.map((t) => (
          <MenuItem key={t} value={t}>
            {DOCUMENT_TYPES[t].label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={type === 'NIT' ? 'NIT' : 'Número de documento'}
        value={value}
        disabled={disabled}
        required
        onChange={(e) => onValueChange(cleanDocument(type, e.target.value).slice(0, def.max))}
        error={!!error}
        helperText={error || def.hint}
        inputProps={{ inputMode: def.alpha ? 'text' : 'numeric', maxLength: def.max }}
        InputProps={{
          endAdornment:
            type === 'NIT' ? (
              <InputAdornment position="end">
                <Tooltip title="Dígito de verificación, calculado automáticamente">
                  <Typography variant="body2" sx={{ fontWeight: 700, color: dv === null ? 'text.disabled' : 'text.primary' }}>
                    DV {dv ?? '–'}
                  </Typography>
                </Tooltip>
              </InputAdornment>
            ) : undefined
        }}
      />
    </>
  );
};

export const SkuField: React.FC<BaseProps & { value: string; onValueChange: (v: string) => void }> = ({ value, onValueChange, ...rest }) => (
  <TextField
    label="SKU o código de barras"
    {...rest}
    value={value}
    onChange={(e) => onValueChange(cleanSku(e.target.value))}
    inputProps={{ maxLength: 32, style: { textTransform: 'uppercase', letterSpacing: '0.03em' } }}
  />
);

/** Reduce la imagen en el navegador (máx. 1200 px, WebP/JPEG) antes de subirla. */
const shrinkImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida'));
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo procesar la imagen'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const webp = canvas.toDataURL('image/webp', 0.85);
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/** Zona para elegir o arrastrar una imagen. Devuelve la ruta subida en onChange. */
export const ImageUpload: React.FC<{
  value?: string;
  onChange: (url: string | undefined) => void;
  upload: (dataUrl: string) => Promise<string>;
  label?: string;
}> = ({ value, onChange, upload, label = 'Imagen del producto' }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Usa una imagen JPG, PNG o WebP');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('La imagen pesa más de 15 MB');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await upload(await shrinkImage(file)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box
        role="button"
        tabIndex={0}
        aria-label={value ? 'Cambiar imagen' : 'Subir imagen'}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        sx={(t) => ({
          position: 'relative',
          height: 168,
          borderRadius: 4,
          border: '1.5px dashed',
          borderColor: dragging ? brand.charge : t.palette.divider,
          bgcolor: dragging ? alpha(brand.charge, 0.08) : 'surface.raised',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          transition: 'border-color 120ms',
          '&:hover': { borderColor: t.palette.text.secondary }
        })}
      >
        {value ? (
          <Box component="img" src={assetUrl(value)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', px: 2 }}>
            <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 32 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Arrastra una imagen o haz clic para elegirla
            </Typography>
            <Typography variant="caption">JPG, PNG o WebP. Se reduce automáticamente.</Typography>
          </Box>
        )}
        {busy && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(27,23,41,0.6)' }}>
            <CircularProgress size={28} sx={{ color: brand.charge }} />
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, minHeight: 32 }}>
        {value && (
          <>
            <Button size="small" variant="outlined" onClick={() => input.current?.click()}>
              Cambiar imagen
            </Button>
            <IconButton size="small" aria-label="Quitar imagen" onClick={() => onChange(undefined)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </>
        )}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </Box>
  );
};
