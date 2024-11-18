import { Typography } from '@ensdomains/thorin'

const RecordEntry = ({ itemKey, data }: any) => {
  let val = <Typography>{data?.value + '' || 'VAL N/A'}</Typography>
  if (data.method === 'burnShares()') {
    val = (
      <Typography>
        <span style={{ color: 'red' }}>{data?.value + '' || 'VAL N/A'}</span>
      </Typography>
    )
  } else if (data.method === 'mintShares()') {
    val = (
      <Typography>
        <span style={{ color: 'green' }}>{data?.value + '' || 'VAL N/A'}</span>
      </Typography>
    )
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, color: 'grey' }}>
        <Typography>{data?.method}</Typography>
        <Typography>
          {data?.key
            ?.split('__')
            ?.map((y: any) => y[0]?.toUpperCase() + y.slice(1))
            ?.join(' ') || 'N/A'}
        </Typography>
      </div>
      {val}
    </div>
  )
}

export default RecordEntry
