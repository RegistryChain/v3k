import { Typography } from '@ensdomains/thorin'

const RecordEntry = ({ itemKey, data }: any) => {
  return (
    <div
      key={itemKey}
      style={{
        display: 'flex',
        width: '100%',
        padding: '0.625rem 0.75rem',
        background: 'hsl(0 0% 96%)',
        border: '1px solid hsl(0 0% 91%)',
        borderRadius: '8px',
        marginBottom: '6px',
      }}
    >
      <Typography style={{ display: 'flex', flex: 1, color: 'grey' }}>
        {data.key
          .split('__')
          .map((y: any) => y[0].toUpperCase() + y.slice(1))
          .join(' ')}
      </Typography>
      <Typography>{data.value}</Typography>
    </div>
  )
}

export default RecordEntry
