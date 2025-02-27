import { TextArea } from './AgentModalStyles'
import { TextField, Select, FormControl, InputLabel } from '@mui/material'
import MenuItem from '@mui/material/MenuItem';
import { on } from 'events';

type FormInputProps = {
  type?: 'text' | 'select' | 'textarea'
  label: string
  value: string
  onChange: (value: string) => void
  options?: string[]
  placeholder?: string
  rows?: number
  required?: boolean
}

export const FormInput = ({
  type = 'text',
  label,
  value,
  onChange,
  options,
  placeholder,
  rows = 1,
  required,
}: FormInputProps) => {
  if (type === 'select') {
    return (
      <FormControl fullWidth required={required}>
        <InputLabel id="select-label">{label}</InputLabel>
        <Select labelId="select-label" value={value} onChange={(e) => onChange(e.target.value)}
          label={label}>
          <MenuItem value="" disabled>{placeholder}</MenuItem>
          {options?.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  } else if (type === 'textarea') {
    return (
      <TextArea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  } else {
    return (
      <FormControl fullWidth>
        <TextField
          required={required}
          label={label}
          variant="outlined"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </FormControl>
    )
  }
}
